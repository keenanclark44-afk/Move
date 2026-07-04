import { useState, useEffect, useCallback } from 'react'
import { addGoal, listGoals, deleteGoal } from '../db.js'

const TERM_LABELS = { short: 'Short term', medium: 'Medium term', long: 'Long term' }

function emptyForm() {
  return { term: 'short', text: '', baseline: '', current: '', target: '', status: '', notes: '' }
}

export default function GoalsTracker() {
  const [goals, setGoals] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(async () => {
    setGoals(await listGoals())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function submit(e) {
    e.preventDefault()
    if (!form.text.trim()) return
    await addGoal({
      term: form.term,
      text: form.text,
      baseline: form.baseline || null,
      current: form.current || null,
      target: form.target || null,
      status: form.status || null,
      notes: form.notes
    })
    setForm(emptyForm())
    refresh()
  }

  async function remove(id) {
    await deleteGoal(id)
    refresh()
  }

  return (
    <div className="card">
      <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(o => !o)}>
        {open ? 'Hide goals' : `Goals & progression (${goals.length})`}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['short', 'medium', 'long'].map(term => {
            const items = goals.filter(g => g.term === term)
            if (!items.length) return null
            return (
              <div key={term}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  {TERM_LABELS[term]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{g.text}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                          {[g.baseline && `from ${g.baseline}`, g.target && `target ${g.target}`, g.status].filter(Boolean).join(' · ')}
                        </div>
                        {g.notes && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{g.notes}</div>}
                      </div>
                      <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => remove(g.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {!goals.length && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No goals set yet.</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={form.term} onChange={e => update('term', e.target.value)} style={{ ...inputStyle, flex: '0 0 130px' }}>
                <option value="short">Short term</option>
                <option value="medium">Medium term</option>
                <option value="long">Long term</option>
              </select>
              <input placeholder="Goal" value={form.text} onChange={e => update('text', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Baseline" value={form.baseline} onChange={e => update('baseline', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input placeholder="Target" value={form.target} onChange={e => update('target', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <input placeholder="Status (e.g. In progress)" value={form.status} onChange={e => update('status', e.target.value)} style={inputStyle} />
            <textarea placeholder="Notes" value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inputStyle, minHeight: 50 }} />
            <button type="submit" className="btn-primary">Add goal</button>
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
