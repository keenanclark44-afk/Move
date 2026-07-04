import { useState, useEffect } from 'react'
import { addEntry, listPlans } from '../db.js'

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    durationMin: '',
    distanceKm: '',
    avgHr: '',
    notes: '',
    score: '',
    feeling: '',
    venue: '',
    result: '',
    goalsScored: '',
    assists: '',
    stamina: '',
    confidence: '',
    touch: '',
    dryMouth: '',
    wentInGoal: '',
    planId: '',
    ankle: false,
    calf: false,
    shin: false
  }
}

export default function EntryForm({ category, isMatch, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState([])

  useEffect(() => {
    if (open) listPlans(category).then(setPlans)
  }, [open, category])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function submit(e) {
    e.preventDefault()
    await addEntry({
      date: form.date,
      source: 'manual',
      category,
      planId: form.planId || null,
      durationMin: Number(form.durationMin) || 0,
      distanceKm: Number(form.distanceKm) || 0,
      avgHr: Number(form.avgHr) || 0,
      notes: form.notes,
      score: isMatch ? form.score || null : null,
      feeling: isMatch ? form.feeling || null : null,
      venue: isMatch ? form.venue || null : null,
      result: isMatch ? form.result || null : null,
      goalsScored: isMatch && form.goalsScored !== '' ? Number(form.goalsScored) : null,
      assists: isMatch && form.assists !== '' ? Number(form.assists) : null,
      stamina: isMatch && form.stamina !== '' ? Number(form.stamina) : null,
      confidence: isMatch && form.confidence !== '' ? Number(form.confidence) : null,
      touch: isMatch && form.touch !== '' ? Number(form.touch) : null,
      dryMouth: isMatch ? form.dryMouth || null : null,
      wentInGoal: isMatch ? form.wentInGoal || null : null,
      painFlags: { ankle: form.ankle, calf: form.calf, shin: form.shin }
    })
    setForm(emptyForm())
    setOpen(false)
    onSaved?.()
  }

  if (!open) {
    return (
      <button className="btn-primary" style={{ width: '100%' }} onClick={() => setOpen(true)}>
        + Log a session
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={fieldStyle}>
        Date
        <input type="date" value={form.date} onChange={e => update('date', e.target.value)} style={inputStyle} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={fieldStyle}>
          Duration (min)
          <input type="number" value={form.durationMin} onChange={e => update('durationMin', e.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          Distance (km)
          <input type="number" step="0.1" value={form.distanceKm} onChange={e => update('distanceKm', e.target.value)} style={inputStyle} />
        </label>
      </div>
      <label style={fieldStyle}>
        Avg HR
        <input type="number" value={form.avgHr} onChange={e => update('avgHr', e.target.value)} style={inputStyle} />
      </label>

      {isMatch && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={fieldStyle}>
              Venue
              <input value={form.venue} onChange={e => update('venue', e.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              Result
              <select value={form.result} onChange={e => update('result', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="draw">Draw</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <label style={fieldStyle}>
              Score
              <input placeholder="e.g. 3-1" value={form.score} onChange={e => update('score', e.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              Goals
              <input type="number" value={form.goalsScored} onChange={e => update('goalsScored', e.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              Assists
              <input type="number" value={form.assists} onChange={e => update('assists', e.target.value)} style={inputStyle} />
            </label>
          </div>

          <div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>Ratings (1-10)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={fieldStyle}>
                Stamina
                <input type="number" min="1" max="10" value={form.stamina} onChange={e => update('stamina', e.target.value)} style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                Confidence
                <input type="number" min="1" max="10" value={form.confidence} onChange={e => update('confidence', e.target.value)} style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                Touch
                <input type="number" min="1" max="10" value={form.touch} onChange={e => update('touch', e.target.value)} style={inputStyle} />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <label style={fieldStyle}>
              Dry mouth?
              <input placeholder="e.g. Yes / Improved" value={form.dryMouth} onChange={e => update('dryMouth', e.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              Went in goal?
              <input placeholder="e.g. No / Twice" value={form.wentInGoal} onChange={e => update('wentInGoal', e.target.value)} style={inputStyle} />
            </label>
          </div>

          <label style={fieldStyle}>
            How it felt overall
            <select value={form.feeling} onChange={e => update('feeling', e.target.value)} style={inputStyle}>
              <option value="">—</option>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="ok">OK</option>
              <option value="poor">Poor</option>
            </select>
          </label>
        </>
      )}

      {plans.length > 0 && (
        <label style={fieldStyle}>
          Plan used (optional)
          <select value={form.planId} onChange={e => update('planId', e.target.value)} style={inputStyle}>
            <option value="">—</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}

      <div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>Pain flags</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['ankle', 'calf', 'shin'].map(part => (
            <label key={part} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input type="checkbox" checked={form[part]} onChange={e => update(part, e.target.checked)} />
              {part}
            </label>
          ))}
        </div>
      </div>

      <label style={fieldStyle}>
        Notes
        <textarea value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-dim)', flex: 1, minWidth: 0 }
const inputStyle = {
  background: 'var(--surface-raised)',
  border: '2px solid var(--line)',
  borderRadius: 8,
  color: 'var(--text)',
  width: '100%',
  padding: '10px 12px',
  fontSize: 15,
  fontFamily: 'inherit'
}
