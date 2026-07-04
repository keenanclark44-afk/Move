// No stored long-lived credentials. The backend holds a short-lived
// session token that expires; when it does, the UI prompts to reconnect.
// Every sync is a deliberate "Sync now" tap, not a silent background pull.

const TOKEN_KEY = 'garmin_session_token'
const TOKEN_EXPIRY_KEY = 'garmin_session_expiry'

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) return null // expired
  return token
}

export function isConnected() {
  return getStoredToken() !== null
}

export async function connect(email, password) {
  const res = await fetch('/api/garmin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Garmin login failed')
  }
  const { sessionToken, expiresInSec } = await res.json()
  localStorage.setItem(TOKEN_KEY, sessionToken)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSec * 1000))
  return true
}

export function disconnect() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

// Pulls new activities since the last synced date and returns them
// already normalized to the shared entry shape.
export async function syncNow(sinceDate) {
  const token = getStoredToken()
  if (!token) throw new Error('not_connected')

  const res = await fetch('/api/garmin/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ sinceDate })
  })

  if (res.status === 401) {
    disconnect()
    throw new Error('session_expired')
  }
  if (!res.ok) throw new Error('sync_failed')

  const { activities } = await res.json()
  return activities.map(normalizeGarminActivity)
}

function normalizeGarminActivity(a) {
  return {
    date: a.startTimeLocal?.slice(0, 10),
    source: 'garmin',
    category: guessCategory(a),
    durationMin: Math.round((a.duration || 0) / 60),
    distanceKm: +(a.distance / 1000).toFixed(2) || 0,
    avgHr: a.averageHR || 0,
    hrZones: {
      z1: a.hrTimeInZone_1 || 0,
      z2: a.hrTimeInZone_2 || 0,
      z3: a.hrTimeInZone_3 || 0,
      z4: a.hrTimeInZone_4 || 0,
      z5: a.hrTimeInZone_5 || 0
    },
    notes: a.activityName || '',
    raw: a
  }
}

// Garmin has no "match vs training" concept, so this is a best-effort guess
// from the activity name/type — the user can still log manually if it's wrong.
function guessCategory(a) {
  const text = `${a.activityType?.typeKey || ''} ${a.activityName || ''}`.toLowerCase()
  if (/(match|game|fixture)/.test(text)) return 'match'
  if (/(soccer|football)/.test(text)) return 'training'
  if (/(strength|gym|cardio)/.test(text)) return 'gym'
  return 'general'
}
