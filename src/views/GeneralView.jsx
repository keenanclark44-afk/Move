import { useState, useEffect, useCallback } from 'react'
import { addMetric, listMetrics, addPhoto, listPhotos, deletePhoto } from '../db.js'
import GarminPanel from '../components/GarminPanel.jsx'
import InjuryLog from '../components/InjuryLog.jsx'
import SupplementsList from '../components/SupplementsList.jsx'
import GoalsTracker from '../components/GoalsTracker.jsx'
import ImportTracker from '../components/ImportTracker.jsx'

const METRIC_LABELS = { vo2max: 'VO2 max', sleep: 'Sleep (hrs)', weight: 'Weight (kg)' }

export default function GeneralView({ entries, onChange }) {
  const [metrics, setMetrics] = useState([])
  const [photos, setPhotos] = useState([])
  const [form, setForm] = useState({ type: 'vo2max', value: '' })

  const refresh = useCallback(async () => {
    setMetrics(await listMetrics())
    setPhotos(await listPhotos())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function submitMetric(e) {
    e.preventDefault()
    if (!form.value) return
    await addMetric({ date: today(), type: form.type, value: Number(form.value) })
    setForm(f => ({ ...f, value: '' }))
    refresh()
  }

  async function onPhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    await addPhoto({ date: today(), dataUrl })
    e.target.value = ''
    refresh()
  }

  const latestByType = Object.keys(METRIC_LABELS).reduce((acc, type) => {
    acc[type] = metrics.find(m => m.type === type)
    return acc
  }, {})

  const recent = entries.slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GarminPanel onSynced={onChange} />

      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>Health overview</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {Object.entries(METRIC_LABELS).map(([type, label]) => (
            <div key={type} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</div>
              <div className="stat" style={{ fontSize: 20, fontWeight: 700 }}>
                {latestByType[type]?.value ?? '—'}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={submitMetric} style={{ display: 'flex', gap: 8 }}>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
            {Object.entries(METRIC_LABELS).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
          <input type="number" step="0.1" placeholder="Value" value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>Progress photos</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <label style={addPhotoStyle}>
            +
            <input type="file" accept="image/*" capture="environment" onChange={onPhotoSelected} style={{ display: 'none' }} />
          </label>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
              <img src={p.dataUrl} alt={p.date} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--line)' }} />
              <button onClick={() => deletePhoto(p.id).then(refresh)} style={removeBtnStyle}>×</button>
            </div>
          ))}
        </div>
      </div>

      <InjuryLog />
      <SupplementsList />
      <GoalsTracker />
      <ImportTracker onChange={onChange} />

      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
          Last {recent.length} session{recent.length === 1 ? '' : 's'}
        </div>
        {!recent.length && <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>No sessions logged yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
              <span className="stat" style={{ color: 'var(--text-dim)' }}>{e.date}</span>
              <span className={`badge badge-${e.category}`}>{e.category}</span>
              <span className="stat">{e.durationMin}min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function today() { return new Date().toISOString().slice(0, 10) }

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
const selectStyle = { ...inputStyle, flex: '0 0 120px' }
const addPhotoStyle = {
  width: 72,
  height: 72,
  flexShrink: 0,
  borderRadius: 10,
  border: '2px dashed var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  color: 'var(--text-dim)',
  cursor: 'pointer'
}
const removeBtnStyle = {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  fontSize: 13,
  lineHeight: '20px',
  padding: 0,
  cursor: 'pointer'
}
