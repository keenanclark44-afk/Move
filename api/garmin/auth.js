// Vercel serverless function: POST /api/garmin/auth
// Body: { email, password, mfaCode? }
// Returns: { sessionToken, expiresInSec }
//
// Uses the unofficial `garth` (Python) or `garmin-connect` (Node) library
// to authenticate directly with sso.garmin.com. No long-lived token is
// persisted to a database — the resulting Garmin auth object is encrypted
// and embedded in a short-lived JWT (sessionToken) that this deployment
// issues to the client. When it expires, the client shows "Reconnect".
//
// NOTE: this is a stub. Wire up your chosen Garmin auth library here —
// see README.md "Garmin backend" section for the two implementation options.

import jwt from 'jsonwebtoken'

const SESSION_TTL_SEC = 60 * 60 * 6 // 6 hours — re-auth a few times a week, not every session

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, mfaCode } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' })
  }

  try {
    // TODO: replace with real Garmin auth call, e.g.:
    // const garminAuth = await garminLogin(email, password, mfaCode)
    const garminAuth = { placeholder: true } // <-- wire this up

    const sessionToken = jwt.sign(
      { garminAuth },
      process.env.SESSION_SECRET,
      { expiresIn: SESSION_TTL_SEC }
    )

    return res.status(200).json({ sessionToken, expiresInSec: SESSION_TTL_SEC })
  } catch (err) {
    return res.status(401).json({ message: 'Garmin login failed — check credentials or MFA code' })
  }
}
