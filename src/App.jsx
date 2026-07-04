import { useEffect, useState, useCallback } from 'react'
import { listEntries } from './db.js'
import TodayCard from './components/TodayCard.jsx'
import EntryForm from './components/EntryForm.jsx'
import EntryList from './components/EntryList.jsx'
import GarminPanel from './components/GarminPanel.jsx'

export default function App() {
  const [entries, setEntries] = useState([])

  const refresh = useCallback(async () => {
    setEntries(await listEntries())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>MOVE</div>
        <h1 style={{ fontSize: 26 }}>Training log</h1>
      </header>

      <GarminPanel onSynced={refresh} />
      <TodayCard latest={entries[0]} />
      <EntryForm onSaved={refresh} />
      <EntryList entries={entries} />
    </div>
  )
}
