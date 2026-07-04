export default function EntryList({ entries }) {
  if (!entries.length) {
    return <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>No sessions logged yet.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(e => {
        const anyPain = Object.values(e.painFlags || {}).some(Boolean)
        return (
          <div key={e.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat" style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.date}</span>
              <span className={`badge badge-${e.category}`}>{e.source}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 15 }}>
              {e.durationMin}min · {e.distanceKm}km · HR {e.avgHr || '—'}
            </div>
            {(e.score || e.feeling) && (
              <div style={{ marginTop: 4, fontSize: 14 }}>
                {e.score}{e.score && e.feeling ? ' · ' : ''}
                {e.feeling && <span style={{ textTransform: 'capitalize' }}>{e.feeling}</span>}
              </div>
            )}
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
