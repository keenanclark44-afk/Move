import { useState, useEffect, useCallback } from 'react'
import { addInjury, listInjuries, deleteInjury } from '../db.js'

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    bodyPart: '',
    injuryType: '',
    grade: '',
    painLevel: '',
    status: '',
    notes: ''
  }
}

export default function InjuryLog() {
  const [injuries, setInjuries] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(async () => {
    setInjuries(await listInjuries())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function submit(e) {
    e.preventDefault()
    if (!form.bodyPart.trim()) return
    await addInjury({
      date: form.date,
      bodyPart: form.bodyPart,
      injuryType: form.injuryType || null,
      grade: form.grade || null,
      painLevel: form.painLevel !== '' ? Number(form.painLevel) : null,
      status: form.status || null,
      notes: form.notes
    })
    setForm(emptyForm())
    refresh()
  }

  async function remove(id) {
    await deleteInjury(id)
    refresh()
  }

  return (
    <div className="card">
      <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(o => !o)}>
        {open ? 'Hide injury log' : `Injury log (${injuries.length})`}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!injuries.length && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No injuries logged yet.</div>}
          {injuries.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {i.bodyPart}{i.injuryType ? ` — ${i.injuryType}` : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  {i.date}{i.grade ? ` · ${i.grade}` : ''}{i.painLevel != null ? ` · pain ${i.painLevel}/10` : ''}{i.status ? ` · ${i.status}` : ''}
                </div>
                {i.notes && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{i.notes}</div>}
              </div>
              <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => remove(i.id)}>
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} style={inputStyle} />
            <input placeholder="Body part" value={form.bodyPart} onChange={e => update('bodyPart', e.target.value)} style={inputStyle} />
            <input placeholder="Injury type (optional)" value={form.injuryType} onChange={e => update('injuryType', e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Grade" value={form.grade} onChange={e => update('grade', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input type="number" min="0" max="10" placeholder="Pain 0-10" value={form.painLevel} onChange={e => update('painLevel', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <input placeholder="Status (e.g. Recovering)" value={form.status} onChange={e => update('status', e.target.value)} style={inputStyle} />
            <textarea placeholder="Notes" value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inputStyle, minHeight: 50 }} />
            <button type="submit" className="btn-primary">Log injury</button>
          </form>
        </div>
      )}
    </div>
  )
}

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
