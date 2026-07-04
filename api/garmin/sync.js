// Vercel serverless function: POST /api/garmin/sync
// Header: Authorization: Bearer <sessionToken>
// Body: { sinceDate }
// Returns: { activities: [...] }  // raw Garmin activity objects
//
// Verifies the session token, reconstructs the Garmin auth context,
// and pulls activities since sinceDate. Returns 401 if the token has
// expired so the client can prompt a reconnect.

import jwt from 'jsonwebtoken'

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
    // TODO: replace with real activity fetch using payload.garminAuth, e.g.:
    // const activities = await getGarminActivities(payload.garminAuth, sinceDate)
    const activities = [] // <-- wire this up

    return res.status(200).json({ activities })
  } catch (err) {
    return res.status(502).json({ message: 'Garmin sync failed' })
  }
}
