// Vercel serverless function: POST /api/garmin/sync
// Header: Authorization: Bearer <sessionToken>
// Body: { sinceDate? }
// Returns: { activities: [...] }  // raw Garmin activity objects
//
// Verifies the session token, restores the Garmin OAuth session from it,
// and pulls recent activities, filtering to those on/after sinceDate.
// Returns 401 if the token has expired so the client can prompt a reconnect.

import jwt from 'jsonwebtoken'
import { GarminConnect } from 'garmin-connect'

const FETCH_LIMIT = 50 // most recent activities to scan per sync; plenty for a few-times-a-week cadence

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'missing session token' })

  let payload
  try {
    payload = jwt.verify(token, process.env.SESSION_SECRET)
  } catch {
    return res.status(401).json({ message: 'session expired' })
  }

  const { sinceDate } = req.body || {}

  try {
    const client = new GarminConnect({ username: '', password: '' })
    client.loadToken(payload.oauth1, payload.oauth2)

    const activities = await client.getActivities(0, FETCH_LIMIT)
    const since = sinceDate ? new Date(sinceDate) : null
    const filtered = since
      ? activities.filter(a => new Date(a.startTimeLocal) >= since)
      : activities

    return res.status(200).json({ activities: filtered })
  } catch (err) {
    return res.status(502).json({ message: 'Garmin sync failed' })
  }
}
