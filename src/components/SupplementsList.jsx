import { useState, useEffect, useCallback } from 'react'
import { addSupplement, listSupplements, deleteSupplement } from '../db.js'

function emptyForm() {
  return { kind: 'supplement', name: '', brand: '', dosage: '', timing: '', status: '', notes: '' }
}

export default function SupplementsList() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(async () => {
    setItems(await listSupplements())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    await addSupplement({
      kind: form.kind,
      name: form.name,
      brand: form.brand || null,
      dosage: form.dosage || null,
      timing: form.timing || null,
      status: form.status || null,
      notes: form.notes
    })
    setForm(emptyForm())
    refresh()
  }

  async function remove(id) {
    await deleteSupplement(id)
    refresh()
  }

  return (
    <div className="card">
      <button type="button" className="btn-ghost" style={{ width: '100%' }} onClick={() => setOpen(o => !o)}>
        {open ? 'Hide supplements' : `Supplements & recovery (${items.length})`}
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!items.length && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Nothing logged yet.</div>}
          {items.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {s.name}
                  <span className={`badge ${s.kind === 'tool' ? 'badge-general' : 'badge-training'}`} style={{ marginLeft: 8 }}>{s.kind}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  {[s.brand, s.dosage, s.timing, s.status].filter(Boolean).join(' · ')}
                </div>
                {s.notes && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{s.notes}</div>}
              </div>
              <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => remove(s.id)}>
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={form.kind} onChange={e => update('kind', e.target.value)} style={{ ...inputStyle, flex: '0 0 130px' }}>
                <option value="supplement">Supplement</option>
                <option value="tool">Recovery tool</option>
              </select>
              <input placeholder="Name" value={form.name} onChange={e => update('name', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <input placeholder="Brand (optional)" value={form.brand} onChange={e => update('brand', e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Dosage" value={form.dosage} onChange={e => update('dosage', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input placeholder="Timing" value={form.timing} onChange={e => update('timing', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <input placeholder="Status (e.g. Active)" value={form.status} onChange={e => update('status', e.target.value)} style={inputStyle} />
            <textarea placeholder="Purpose & notes" value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inputStyle, minHeight: 50 }} />
            <button type="submit" className="btn-primary">Add</button>
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
