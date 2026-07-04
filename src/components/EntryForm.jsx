import { useState } from 'react'
import { addEntry } from '../db.js'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  durationMin: '',
  distanceKm: '',
  avgHr: '',
  notes: '',
  ankle: false,
  calf: false,
  shin: false
}

export default function EntryForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function submit(e) {
    e.preventDefault()
    await addEntry({
      date: form.date,
      source: 'manual',
      durationMin: Number(form.durationMin) || 0,
      distanceKm: Number(form.distanceKm) || 0,
      avgHr: Number(form.avgHr) || 0,
      notes: form.notes,
      painFlags: { ankle: form.ankle, calf: form.calf, shin: form.shin }
    })
    setForm(emptyForm)
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

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-dim)', flex: 1 }
const inputStyle = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '10px 12px',
  fontSize: 15,
  fontFamily: 'inherit'
}
