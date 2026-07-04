import { useEffect, useState, useCallback } from 'react'
import { listEntries } from './db.js'
import TabBar from './components/TabBar.jsx'
import GeneralView from './views/GeneralView.jsx'
import SessionView from './views/SessionView.jsx'

const TITLES = { general: 'Overview', match: 'Football Matches', gym: 'Gym', training: 'Football Training', padel: 'Padel' }

export default function App() {
  const [tab, setTab] = useState('general')
  const [entries, setEntries] = useState([])

  const refresh = useCallback(async () => {
    setEntries(await listEntries())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>MOVE</div>
        <h1 style={{ fontSize: 26 }}>{TITLES[tab]}</h1>
      </header>

      <div style={{ flex: 1, padding: '0 16px 24px' }}>
        {tab === 'general'
          ? <GeneralView entries={entries} onChange={refresh} />
          : <SessionView category={tab} entries={entries.filter(e => e.category === tab)} onChange={refresh} />}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
