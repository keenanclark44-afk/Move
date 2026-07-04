import { useState } from 'react'
import { isConnected, connect, disconnect, syncNow } from '../lib/garmin.js'
import { addEntry } from '../db.js'

export default function GarminPanel({ onSynced }) {
  const [connected, setConnected] = useState(isConnected())
  const [showLogin, setShowLogin] = useState(false)
  const [creds, setCreds] = useState({ email: '', password: '', mfaCode: '' })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleConnect(e) {
    e.preventDefault()
    setBusy(true)
    setStatus('')
    try {
      await connect(creds.email, creds.password, creds.mfaCode)
      setConnected(true)
      setShowLogin(false)
      setCreds({ email: '', password: '', mfaCode: '' })
    } catch (err) {
      setStatus(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setBusy(true)
    setStatus('')
    try {
      const activities = await syncNow()
      for (const a of activities) await addEntry(a)
      setStatus(`Pulled ${activities.length} new session${activities.length === 1 ? '' : 's'}`)
      onSynced?.()
    } catch (err) {
      if (err.message === 'session_expired' || err.message === 'not_connected') {
        setConnected(false)
        setStatus('Session expired — reconnect to sync')
      } else {
        setStatus('Sync failed — try again')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Garmin</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {connected ? 'Connected' : 'Not connected'}
          </div>
        </div>
        {connected ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" disabled={busy} onClick={handleSync}>
              {busy ? 'Syncing…' : 'Sync now'}
            </button>
            <button className="btn-ghost" onClick={() => { disconnect(); setConnected(false) }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => setShowLogin(true)}>Reconnect</button>
        )}
      </div>

      {status && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>{status}</div>}

      {showLogin && (
        <form onSubmit={handleConnect} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Garmin email" value={creds.email}
            onChange={e => setCreds(c => ({ ...c, email: e.target.value }))} style={inputStyle} />
          <input placeholder="Password" type="password" value={creds.password}
            onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} style={inputStyle} />
          <input placeholder="MFA code (if enabled)" value={creds.mfaCode}
            onChange={e => setCreds(c => ({ ...c, mfaCode: e.target.value }))} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowLogin(false)}>Cancel</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Session only — nothing is stored long-term. You'll reconnect when it expires.
          </div>
        </form>
      )}
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '10px 12px',
  fontSize: 15,
  fontFamily: 'inherit'
}
