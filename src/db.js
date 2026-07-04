import { openDB } from 'idb'

// Every entry, regardless of source (garmin | screenshot | manual),
// is normalized into this same shape before it hits the store.
//
// entry: {
//   id: string (uuid)
//   date: string (ISO date)
//   source: 'garmin' | 'screenshot' | 'manual'
//   category: 'match' | 'gym' | 'training' | 'padel' | 'general'
//   planId: string | null (references a plans record)
//   durationMin: number
//   distanceKm: number
//   avgHr: number
//   maxHr: number
//   maxSpeedKmh: number | null
//   calories: number
//   hrZones: { z1: min, z2: min, z3: min, z4: min, z5: min }
//   painFlags: { ankle: boolean, calf: boolean, shin: boolean }
//   score: string | null (match category only, free text e.g. "3-1")
//   feeling: string | null (match category only, "great" | "good" | "ok" | "poor")
//   venue, result ('win'|'loss'|'draw'|'unknown'), goalsScored, assists,
//   stamina, confidence, touch (1-10), dryMouth, wentInGoal — match category only
//   notes: string
//   raw: object (original payload for debugging / re-parsing)
//   synced: boolean (whether it's been pushed to the backend)
// }
//
// plan: { id, name, category, description, createdAt }
// metric: { id, date, type: 'vo2max' | 'sleep' | 'weight', value }
// photo: { id, date, dataUrl, note } — device-only, never synced to the backend
// injury: { id, date, bodyPart, injuryType, grade, painLevel, swelling, treatment, sawGpPhysio, daysOut, status, notes }
// supplement: { id, kind: 'supplement' | 'tool', name, brand, dosage, timing, status, notes }
// goal: { id, term: 'short' | 'medium' | 'long', text, baseline, current, target, status, notes }

const DB_NAME = 'move-db'
const DB_VERSION = 3

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      let entries
      if (oldVersion < 1) {
        entries = db.createObjectStore('entries', { keyPath: 'id' })
        entries.createIndex('date', 'date')
        entries.createIndex('synced', 'synced')
      } else {
        entries = transaction.objectStore('entries')
      }

      if (oldVersion < 2) {
        entries.createIndex('category', 'category')

        // Pre-v2 entries predate the category field — default them to
        // 'general' so they still show up once views start filtering by it.
        let cursor = await entries.openCursor()
        while (cursor) {
          if (!cursor.value.category) {
            cursor.update({ ...cursor.value, category: 'general' })
          }
          cursor = await cursor.continue()
        }

        db.createObjectStore('plans', { keyPath: 'id' })

        const metrics = db.createObjectStore('metrics', { keyPath: 'id' })
        metrics.createIndex('date', 'date')
        metrics.createIndex('type', 'type')

        const photos = db.createObjectStore('photos', { keyPath: 'id' })
        photos.createIndex('date', 'date')
      }

      if (oldVersion < 3) {
        const injuries = db.createObjectStore('injuries', { keyPath: 'id' })
        injuries.createIndex('date', 'date')

        db.createObjectStore('supplements', { keyPath: 'id' })

        const goals = db.createObjectStore('goals', { keyPath: 'id' })
        goals.createIndex('term', 'term')
      }
    }
  })
}

export async function addEntry(entry) {
  const db = await getDb()
  const full = {
    id: crypto.randomUUID(),
    synced: false,
    category: 'general',
    planId: null,
    maxHr: 0,
    maxSpeedKmh: null,
    calories: 0,
    hrZones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 },
    painFlags: { ankle: false, calf: false, shin: false },
    score: null,
    feeling: null,
    venue: null,
    result: null,
    goalsScored: null,
    assists: null,
    stamina: null,
    confidence: null,
    touch: null,
    dryMouth: null,
    wentInGoal: null,
    notes: '',
    raw: null,
    ...entry
  }
  await db.add('entries', full)
  return full
}

export async function listEntries() {
  const db = await getDb()
  const all = await db.getAllFromIndex('entries', 'date')
  return all.reverse() // newest first
}

export async function listEntriesByCategory(category) {
  const db = await getDb()
  const all = await db.getAllFromIndex('entries', 'category', category)
  return all.sort((a, b) => b.date.localeCompare(a.date)) // newest first
}

export async function getUnsyncedEntries() {
  const db = await getDb()
  const all = await db.getAll('entries')
  return all.filter(e => !e.synced)
}

export async function markSynced(id) {
  const db = await getDb()
  const entry = await db.get('entries', id)
  if (entry) {
    entry.synced = true
    await db.put('entries', entry)
  }
}

export async function deleteEntry(id) {
  const db = await getDb()
  await db.delete('entries', id)
}

// --- Plans ---

export async function addPlan(plan) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), description: '', createdAt: new Date().toISOString(), ...plan }
  await db.add('plans', full)
  return full
}

export async function listPlans(category) {
  const db = await getDb()
  const all = await db.getAll('plans')
  const filtered = category ? all.filter(p => p.category === category) : all
  return filtered.sort((a, b) => a.name.localeCompare(b.name))
}

export async function deletePlan(id) {
  const db = await getDb()
  await db.delete('plans', id)
}

// Used by the tracker importer to link sessions to a plan by name without
// creating duplicates when the same plan name appears across many rows.
export async function getOrCreatePlan(name, category) {
  const existing = await listPlans(category)
  const match = existing.find(p => p.name === name)
  if (match) return match
  return addPlan({ name, category })
}

// --- Metrics (VO2 max / sleep / weight) ---

export async function addMetric(metric) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), ...metric }
  await db.add('metrics', full)
  return full
}

export async function listMetrics(type) {
  const db = await getDb()
  const all = type ? await db.getAllFromIndex('metrics', 'type', type) : await db.getAll('metrics')
  return all.sort((a, b) => b.date.localeCompare(a.date)) // newest first
}

export async function deleteMetric(id) {
  const db = await getDb()
  await db.delete('metrics', id)
}

// --- Progress photos (device-only) ---

export async function addPhoto(photo) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), note: '', ...photo }
  await db.add('photos', full)
  return full
}

export async function listPhotos() {
  const db = await getDb()
  const all = await db.getAllFromIndex('photos', 'date')
  return all.reverse() // newest first
}

export async function deletePhoto(id) {
  const db = await getDb()
  await db.delete('photos', id)
}

// --- Injury log ---

export async function addInjury(injury) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), notes: '', ...injury }
  await db.add('injuries', full)
  return full
}

export async function listInjuries() {
  const db = await getDb()
  const all = await db.getAllFromIndex('injuries', 'date')
  return all.reverse() // newest first
}

export async function deleteInjury(id) {
  const db = await getDb()
  await db.delete('injuries', id)
}

// --- Supplements & recovery tools ---

export async function addSupplement(supplement) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), kind: 'supplement', notes: '', ...supplement }
  await db.add('supplements', full)
  return full
}

export async function listSupplements() {
  const db = await getDb()
  const all = await db.getAll('supplements')
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function deleteSupplement(id) {
  const db = await getDb()
  await db.delete('supplements', id)
}

// --- Goals & progression ---

export async function addGoal(goal) {
  const db = await getDb()
  const full = { id: crypto.randomUUID(), notes: '', ...goal }
  await db.add('goals', full)
  return full
}

export async function listGoals(term) {
  const db = await getDb()
  const all = term ? await db.getAllFromIndex('goals', 'term', term) : await db.getAll('goals')
  return all
}

export async function deleteGoal(id) {
  const db = await getDb()
  await db.delete('goals', id)
}
