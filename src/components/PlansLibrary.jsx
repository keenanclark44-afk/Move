import { useState, useEffect, useCallback } from 'react'
import { addPlan, listPlans, deletePlan } from '../db.js'

export default function PlansLibrary({ category, onChange }) {
  const [plans, setPlans] = useState([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const refresh = useCallback(async () => {
    setPlans(await listPlans(category))
  }, [category])

  useEffect(() => { refresh() }, [refresh])

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addPlan({ name: name.trim(), description, category })
    setName('')
    setDescription('')
    refresh()
    onChange?.()
  }

  async function remove(id) {
    await deletePlan(id)
    refresh()
    onChange?.()
  }

  return (
    <div className="card">
      <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(o => !o)}>
        {open ? 'Hide plans' : `Plans library (${plans.length})`}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!plans.length && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No saved plans yet.</div>}
          {plans.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{p.description}</div>}
              </div>
              <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => remove(p.id)}>
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <input placeholder="Plan name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
            <button type="submit" className="btn-primary">Save plan</button>
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
  padding: '10px 12px',
  fontSize: 15,
  fontFamily: 'inherit'
}
