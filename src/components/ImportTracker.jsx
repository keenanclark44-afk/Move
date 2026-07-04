import { useState } from 'react'
import { addEntry, addInjury, addSupplement, addGoal, addMetric, getOrCreatePlan } from '../db.js'

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
const SESSION_CATEGORY = { gym: 'gym', freestyle: 'training', 'warm up': 'training', padel: 'padel', run: 'gym' }

function pad(n) { return String(n).padStart(2, '0') }
function todayIso() { return new Date().toISOString().slice(0, 10) }
function normCell(v) { return String(v ?? '').trim() }
function isBlankRow(row) { return row.every(c => normCell(c) === '') }

function numFromText(raw) {
  if (raw == null) return null
  const m = String(raw).match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

// Handles "23 Apr 2026", "Apr 2026" (day-less, defaults to the 1st), and a
// leading "~" for approximate dates. Anything else (e.g. "Ongoing", "TBD")
// falls back to today's date and gets flagged in the import summary.
function parseDate(raw) {
  const s = normCell(raw).replace(/^~/, '').trim()
  let m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/)
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (month != null) return { date: `${m[3]}-${pad(month + 1)}-${pad(Number(m[1]))}`, fallback: false }
  }
  m = s.match(/^([A-Za-z]{3,})\s+(\d{4})/)
  if (m) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (month != null) return { date: `${m[2]}-${pad(month + 1)}-01`, fallback: true }
  }
  return { date: todayIso(), fallback: true }
}

function parseDurationMin(raw) {
  const parts = normCell(raw).split(':').map(Number)
  if (!parts.length || parts.some(isNaN)) return 0
  if (parts.length === 2) return Math.round(parts[0] + parts[1] / 60)
  if (parts.length === 3) return Math.round(parts[0] * 60 + parts[1] + parts[2] / 60)
  return 0
}

function zoneMinutes(durationMin, pctRaw) {
  const pct = numFromText(pctRaw)
  return pct == null ? 0 : Math.round((durationMin * pct) / 100)
}

function findSheetRows(XLSX, wb, substr) {
  const name = wb.SheetNames.find(n => n.toLowerCase().includes(substr.toLowerCase()))
  return name ? XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' }) : null
}

function findAllHeaderIndices(rows, sigFirstCells) {
  const sig = sigFirstCells.map(s => s.toLowerCase())
  const indices = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(normCell).map(s => s.toLowerCase())
    if (sig.every((s, idx) => row[idx] === s)) indices.push(i)
  }
  return indices
}

function nonEmptyCount(row) { return row.filter(c => normCell(c) !== '').length }

function extractDataRows(rows, headerIdx) {
  const data = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    if (isBlankRow(rows[i])) break
    // Skip stray single-cell notes (e.g. a "HOW TO LOG:" instruction row)
    // without stopping — real rows can resume after them.
    if (nonEmptyCount(rows[i]) < 3) continue
    data.push(rows[i])
  }
  return data
}

async function importFitnessSessions(rows, summary) {
  if (!rows) return
  const headerIdx = findAllHeaderIndices(rows, ['date', 'session type', 'plan/activity', 'total time'])[0]
  if (headerIdx == null) return
  for (const row of extractDataRows(rows, headerIdx)) {
    const [dateRaw, sessionType, planActivity, totalTime, avgHr, maxHr, activeCal, z1, z2, z3, z4, , maxSpeed, notes] = row
    if (!normCell(dateRaw)) continue
    const { date, fallback } = parseDate(dateRaw)
    if (fallback) summary.fallbackDates.push(`Fitness Sessions: "${dateRaw}" → ${date}`)
    const category = SESSION_CATEGORY[normCell(sessionType).toLowerCase()] || 'gym'
    const durationMin = parseDurationMin(totalTime)
    const planId = normCell(planActivity) ? (await getOrCreatePlan(normCell(planActivity), category)).id : null
    await addEntry({
      date,
      source: 'import',
      category,
      planId,
      durationMin,
      avgHr: numFromText(avgHr) || 0,
      maxHr: numFromText(maxHr) || 0,
      calories: numFromText(activeCal) || 0,
      maxSpeedKmh: numFromText(maxSpeed),
      hrZones: {
        z1: zoneMinutes(durationMin, z1),
        z2: zoneMinutes(durationMin, z2),
        z3: zoneMinutes(durationMin, z3),
        z4: zoneMinutes(durationMin, z4),
        z5: 0
      },
      notes: normCell(notes)
    })
    summary.sessions++
  }
}

async function importMatches(rows, summary) {
  if (!rows) return
  const headerIdx = findAllHeaderIndices(rows, ['date', 'venue', 'result', 'goals'])[0]
  if (headerIdx == null) return
  for (const row of extractDataRows(rows, headerIdx)) {
    const [dateRaw, venue, result, goalsScored, assists, avgHr, maxHr, maxSpeed, stamina, confidence, touch, dryMouth, wentInGoal, injuries, notes] = row
    if (!normCell(dateRaw)) continue
    const { date, fallback } = parseDate(dateRaw)
    if (fallback) summary.fallbackDates.push(`Match Performance: "${dateRaw}" → ${date}`)
    const resultNorm = normCell(result).toLowerCase()
    await addEntry({
      date,
      source: 'import',
      category: 'match',
      venue: normCell(venue) || null,
      result: ['win', 'loss', 'draw'].includes(resultNorm) ? resultNorm : 'unknown',
      goalsScored: numFromText(goalsScored),
      assists: numFromText(assists),
      avgHr: numFromText(avgHr) || 0,
      maxHr: numFromText(maxHr) || 0,
      maxSpeedKmh: numFromText(maxSpeed),
      stamina: numFromText(stamina),
      confidence: numFromText(confidence),
      touch: numFromText(touch),
      dryMouth: normCell(dryMouth) || null,
      wentInGoal: normCell(wentInGoal) || null,
      notes: normCell(notes)
    })
    summary.matches++

    const injuryText = normCell(injuries)
    if (injuryText && !/^none/i.test(injuryText)) {
      await addInjury({ date, bodyPart: injuryText, notes: `Logged from match on ${date}` })
      summary.injuries++
    }
  }
}

async function importInjuries(rows, summary) {
  if (!rows) return
  const headerIdx = findAllHeaderIndices(rows, ['date', 'body part', 'injury type'])[0]
  if (headerIdx == null) return
  for (const row of extractDataRows(rows, headerIdx)) {
    const [dateRaw, bodyPart, injuryType, grade, painLevel, swelling, treatment, gpPhysio, daysOut, status, notes] = row
    if (!normCell(bodyPart)) continue
    const { date, fallback } = parseDate(dateRaw)
    if (fallback) summary.fallbackDates.push(`Injury & Recovery: "${dateRaw}" → ${date}`)
    await addInjury({
      date,
      bodyPart: normCell(bodyPart),
      injuryType: normCell(injuryType) || null,
      grade: normCell(grade) || null,
      painLevel: numFromText(painLevel),
      swelling: normCell(swelling) || null,
      treatment: normCell(treatment) || null,
      sawGpPhysio: normCell(gpPhysio) || null,
      daysOut: normCell(daysOut) || null,
      status: normCell(status) || null,
      notes: normCell(notes)
    })
    summary.injuries++
  }
}

async function importSupplements(rows, summary) {
  if (!rows) return
  const suppHeaderIdx = findAllHeaderIndices(rows, ['supplement', 'brand', 'dosage'])[0]
  if (suppHeaderIdx != null) {
    for (const row of extractDataRows(rows, suppHeaderIdx)) {
      const [name, brand, dosage, timing, status, notes] = row
      if (!normCell(name)) continue
      await addSupplement({ kind: 'supplement', name: normCell(name), brand: normCell(brand) || null, dosage: normCell(dosage) || null, timing: normCell(timing) || null, status: normCell(status) || null, notes: normCell(notes) })
      summary.supplements++
    }
  }
  const toolHeaderIdx = findAllHeaderIndices(rows, ['tool', 'product', 'frequency'])[0]
  if (toolHeaderIdx != null) {
    for (const row of extractDataRows(rows, toolHeaderIdx)) {
      const [name, brand, dosage, timing, status, notes] = row
      if (!normCell(name)) continue
      await addSupplement({ kind: 'tool', name: normCell(name), brand: normCell(brand) || null, dosage: normCell(dosage) || null, timing: normCell(timing) || null, status: normCell(status) || null, notes: normCell(notes) })
      summary.supplements++
    }
  }
}

async function importGoals(rows, summary) {
  if (!rows) return
  const headerIdxs = findAllHeaderIndices(rows, ['goal', 'baseline', 'current', 'target'])
  for (const headerIdx of headerIdxs) {
    const sectionTitle = normCell(rows[headerIdx - 1]?.[0]).toLowerCase()
    const term = sectionTitle.includes('medium') ? 'medium' : sectionTitle.includes('long') ? 'long' : 'short'
    for (const row of extractDataRows(rows, headerIdx)) {
      const [text, baseline, current, target, status, notes] = row
      if (!normCell(text)) continue
      await addGoal({ term, text: normCell(text), baseline: normCell(baseline) || null, current: normCell(current) || null, target: normCell(target) || null, status: normCell(status) || null, notes: normCell(notes) })
      summary.goals++
    }
  }
}

async function importVo2MaxBaseline(rows, summary) {
  if (!rows) return
  let baselineDate = null
  for (const row of rows) {
    const m = normCell(row[0]).match(/baseline metrics\s*\(([A-Za-z]+)\s+(\d{4})\)/i)
    if (m) {
      const month = MONTHS[m[1].slice(0, 3).toLowerCase()]
      if (month != null) baselineDate = `${m[2]}-${pad(month + 1)}-01`
    }
  }
  const headerIdx = findAllHeaderIndices(rows, ['metric', 'baseline value', 'current value'])[0]
  if (headerIdx == null) return
  const vo2Row = extractDataRows(rows, headerIdx).find(r => normCell(r[0]).toLowerCase().includes('vo2'))
  if (!vo2Row) return
  const value = numFromText(vo2Row[1])
  if (value == null) return
  await addMetric({ date: baselineDate || todayIso(), type: 'vo2max', value })
  summary.metrics++
}

export default function ImportTracker({ onChange }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  async function onFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    setSummary(null)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })

      const result = { sessions: 0, matches: 0, injuries: 0, supplements: 0, goals: 0, metrics: 0, fallbackDates: [] }

      await importFitnessSessions(findSheetRows(XLSX, wb, 'fitness sessions'), result)
      await importMatches(findSheetRows(XLSX, wb, 'match performance'), result)
      await importInjuries(findSheetRows(XLSX, wb, 'injury'), result)
      await importSupplements(findSheetRows(XLSX, wb, 'supplements'), result)
      await importGoals(findSheetRows(XLSX, wb, 'goals'), result)
      await importVo2MaxBaseline(findSheetRows(XLSX, wb, 'dashboard'), result)

      setSummary(result)
      onChange?.()
    } catch (err) {
      setError('Could not read that file — make sure it is the tracker .xlsx export.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(o => !o)}>
        {open ? 'Hide import' : 'Import from tracker spreadsheet'}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Pick the Football_Fitness_Tracker.xlsx file. This adds records — running it twice will
            create duplicates, so only import each file once.
          </div>
          <label className="btn-primary" style={{ textAlign: 'center', cursor: 'pointer' }}>
            {busy ? 'Importing…' : 'Choose file'}
            <input type="file" accept=".xlsx" onChange={onFileSelected} disabled={busy} style={{ display: 'none' }} />
          </label>

          {error && <div style={{ fontSize: 13, color: 'var(--pain)' }}>{error}</div>}

          {summary && (
            <div style={{ fontSize: 14 }}>
              <div>Imported {summary.sessions} sessions, {summary.matches} matches, {summary.injuries} injury log entries, {summary.supplements} supplements/tools, {summary.goals} goals{summary.metrics ? `, ${summary.metrics} health metric` : ''}.</div>
              {summary.fallbackDates.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                  {summary.fallbackDates.length} row{summary.fallbackDates.length === 1 ? '' : 's'} had an
                  approximate or unreadable date and defaulted to the 1st of the month (or today):
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    {summary.fallbackDates.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
