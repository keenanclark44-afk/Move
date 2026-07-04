// Vercel serverless function: POST /api/garmin/auth
// Body: { email, password }
// Returns: { sessionToken, expiresInSec }
//
// Authenticates directly with Garmin via the `garmin-connect` npm package.
// No long-lived token is persisted to a database — the resulting OAuth1/OAuth2
// tokens are embedded in a short-lived JWT (sessionToken) that this deployment
// issues to the client. When it expires, the client shows "Reconnect".
//
// garmin-connect does not yet support MFA-enabled accounts (open TODO in the
// library) — accounts with MFA turned on will fail login below.

import jwt from 'jsonwebtoken'
import { GarminConnect } from 'garmin-connect'

const SESSION_TTL_SEC = 60 * 60 * 6 // 6 hours — re-auth a few times a week, not every session

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' })
  }

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()

    const sessionToken = jwt.sign(
      { oauth1: client.client.oauth1Token, oauth2: client.client.oauth2Token },
      process.env.SESSION_SECRET,
      { expiresIn: SESSION_TTL_SEC }
    )

    return res.status(200).json({ sessionToken, expiresInSec: SESSION_TTL_SEC })
  } catch (err) {
    return res.status(401).json({ message: 'Garmin login failed — check credentials, or the account has MFA enabled (not yet supported)' })
  }
}
