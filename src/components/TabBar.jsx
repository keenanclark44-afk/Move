const TABS = [
  { key: 'general', label: 'General', color: 'var(--ink)' },
  { key: 'match', label: 'Matches', color: 'var(--blue)' },
  { key: 'gym', label: 'Gym', color: 'var(--red)' },
  { key: 'training', label: 'Training', color: 'var(--yellow)' }
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`tab-btn${active === t.key ? ' active' : ''}`}
          style={{ '--tab-color': t.color }}
          onClick={() => onChange(t.key)}
        >
          <span className="tab-dot" />
          {t.label}
        </button>
      ))}
    </nav>
  )
}
