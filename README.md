# Move — personal training & rehab tracker

Installable PWA with four tabs (General, Football Matches, Gym, Football
Training), manual entry logging, and live Garmin sync.

## What's built

- Full React + Vite frontend, installable as a PWA (manifest + service worker
  via `vite-plugin-pwa`)
- Local-first storage: every entry writes to IndexedDB immediately, so the
  app works offline and never blocks on network
- Tab structure: General (health overview: VO2 max/sleep/weight, progress
  photos, rolling summary of the last 5 sessions across all tabs), Football
  Matches (score + how-it-felt + intensity-vs-last-match), Gym, and Football
  Training — all sharing one `entries` store with a `category` field
- Workout plans library (`plans` store) — save a plan per category, link it
  to a logged session via `planId`
- Garmin panel: connect → session token (6hr) → sync now → auto-prompts
  reconnect when the session expires. Nothing long-lived is stored.
- `/api/garmin/auth` and `/api/garmin/sync` — wired to the real
  [`garmin-connect`](https://www.npmjs.com/package/garmin-connect) npm
  package. Login exchanges Garmin OAuth1/OAuth2 tokens into a signed JWT;
  sync restores that session and pulls recent activities. Note:
  `garmin-connect` doesn't yet support MFA-enabled Garmin accounts.
- Manual entry form with pain flags (ankle/calf/shin) as first-class fields

## What's not done yet (needs your call)

1. **Screenshot parsing endpoint** — `/api/parse-screenshot`, calls the
   Claude API with the image, returns a normalized entry. Not built yet;
   slots into the same `db.js` shape when you're ready for phase 2.

2. **Supabase connection** — `schema.sql` is ready to run (entries, plans,
   metrics), but the client doesn't push to it yet. Right now entries only
   live in IndexedDB on-device. Progress photos are intentionally
   device-only and never sync to Supabase.

3. **Historical Excel import** — `Football_Fitness_Tracker.xlsx` import via
   Google Drive connector, once available.

## Deploying

```bash
npm install
npm run dev          # local dev server
```

1. **Vercel**: `npm i -g vercel && vercel` from this folder. Push to GitHub
   first if you want auto-deploys on commit.
2. **Supabase**: create a project, run `schema.sql` in the SQL editor, then
   set `SUPABASE_URL` / `SUPABASE_ANON_KEY` as Vercel env vars.
3. **Session secret**: set `SESSION_SECRET` in Vercel env vars (any long
   random string) — signs the Garmin session tokens.
4. **Icons**: drop `icon-192.png` and `icon-512.png` into `/public` before
   deploying — referenced in `vite.config.js` manifest but not generated here.

## Design tokens

Bold white base with a primary red/blue/yellow palette: blue for Football
Matches, red for Gym (and pain flags), yellow for Football Training, ink
black for General and primary actions — graphic and high-contrast rather
than moody. Space Grotesk for numbers/headers, Inter for body, IBM Plex Mono
for stats.
