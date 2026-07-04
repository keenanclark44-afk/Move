import EntryForm from '../components/EntryForm.jsx'
import EntryList from '../components/EntryList.jsx'
import PlansLibrary from '../components/PlansLibrary.jsx'

export default function SessionView({ category, entries, onChange }) {
  const isMatch = category === 'match'
  const intensityNote = isMatch ? compareIntensity(entries) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EntryForm category={category} isMatch={isMatch} onSaved={onChange} />

      {intensityNote && (
        <div className="card" style={{ fontSize: 14 }}>{intensityNote}</div>
      )}

      <PlansLibrary category={category} onChange={onChange} />

      <EntryList entries={entries} />
    </div>
  )
}

function compareIntensity(entries) {
  const [latest, previous] = entries
  if (!latest || !previous || !latest.avgHr || !previous.avgHr) return null
  const diff = latest.avgHr - previous.avgHr
  if (diff === 0) return `Same average HR as your last match (${latest.avgHr} bpm).`
  const direction = diff > 0 ? 'more' : 'less'
  return `${Math.abs(diff)} bpm ${direction} intense than your last match (${previous.avgHr} → ${latest.avgHr} bpm).`
}
