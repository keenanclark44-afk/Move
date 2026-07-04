const sourceColor = { garmin: 'var(--teal)', screenshot: 'var(--amber)', manual: 'var(--text-dim)' }

export default function EntryList({ entries }) {
  if (!entries.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
      {entries.map(e => {
        const anyPain = Object.values(e.painFlags || {}).some(Boolean)
        return (
          <div key={e.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat" style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.date}</span>
              <span style={{ fontSize: 11, color: sourceColor[e.source], fontWeight: 600, textTransform: 'uppercase' }}>
                {e.source}
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: 15 }}>
              {e.durationMin}min · {e.distanceKm}km · HR {e.avgHr || '—'}
            </div>
            {anyPain && (
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--pain)' }}>
                ⚠ {Object.entries(e.painFlags).filter(([, v]) => v).map(([k]) => k).join(', ')}
              </div>
            )}
            {e.notes && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-dim)' }}>{e.notes}</div>}
          </div>
        )
      })}
    </div>
  )
}
