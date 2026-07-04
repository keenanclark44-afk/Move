import { openDB } from 'idb'

// Every entry, regardless of source (garmin | screenshot | manual),
// is normalized into this same shape before it hits the store.
//
// entry: {
//   id: string (uuid)
//   date: string (ISO date)
//   source: 'garmin' | 'screenshot' | 'manual'
//   durationMin: number
//   distanceKm: number
//   avgHr: number
//   hrZones: { z1: min, z2: min, z3: min, z4: min, z5: min }
//   painFlags: { ankle: boolean, calf: boolean, shin: boolean }
//   notes: string
//   raw: object (original payload for debugging / re-parsing)
//   synced: boolean (whether it's been pushed to the backend)
// }

const DB_NAME = 'move-db'
const DB_VERSION = 1

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('entries', { keyPath: 'id' })
      store.createIndex('date', 'date')
      store.createIndex('synced', 'synced')
    }
  })
}

export async function addEntry(entry) {
  const db = await getDb()
  const full = {
    id: crypto.randomUUID(),
    synced: false,
    hrZones: { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 },
    painFlags: { ankle: false, calf: false, shin: false },
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
