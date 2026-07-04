export default function TodayCard({ latest }) {
  const hasEntry = Boolean(latest)
  const anyPain = hasEntry && Object.values(latest.painFlags).some(Boolean)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 4 }}>
        Last session
      </div>
      {!hasEntry && (
        <h2 style={{ fontSize: 22 }}>No entries yet — log one below</h2>
      )}
      {hasEntry && (
        <>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>
            {latest.durationMin}<span style={{ fontSize: 16, color: 'var(--text-dim)' }}> min</span>
            {'  '}
            <span style={{ color: 'var(--teal)' }}>{latest.distanceKm}km</span>
          </h2>
          <div className="stat" style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            {latest.date} · avg HR {latest.avgHr || '—'} · via {latest.source}
          </div>
          {anyPain ? (
            <div style={{ marginTop: 10, color: 'var(--pain)', fontSize: 14, fontWeight: 600 }}>
              ⚠ Pain flagged — check notes
            </div>
          ) : (
            <div style={{ marginTop: 10, color: 'var(--amber)', fontSize: 14, fontWeight: 600 }}>
              ✓ No pain reported
            </div>
          )}
        </>
      )}
    </div>
  )
}
