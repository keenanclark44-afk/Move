# Move — personal training & rehab tracker

Installable PWA. One `entries` schema, three ways in: manual form, live Garmin
sync (session-based, re-auth on expiry), and screenshot parsing (phase 2).

## What's built

- Full React + Vite frontend, installable as a PWA (manifest + service worker
  via `vite-plugin-pwa`)
- Local-first storage: every entry writes to IndexedDB immediately, so the
  app works offline and never blocks on network
- Garmin panel: connect → session token (6hr) → sync now → auto-prompts
  reconnect when the session expires. Nothing long-lived is stored.
- Manual entry form with pain flags (ankle/calf/shin) as first-class fields
- `/api/garmin/auth` and `/api/garmin/sync` — serverless function **stubs**.
  The scaffolding, token handling, and error paths are wired up; the actual
  Garmin API calls need one of the two options below.

## What's not done yet (needs your call)

1. **Garmin backend implementation.** No official consumer API exists — every
   working integration uses one of:
   - [`garth`](https://github.com/matin/garth) (Python) — lightweight, most
     Garmin MCP projects use this
   - [`garmin-connect`](https://www.npmjs.com/package/garmin-connect) (Node) —
     keeps everything in one language if you want pure JS/TS

   Node keeps this a single-language repo (simpler on Vercel). Python needs a
   small separate service (e.g. a Vercel Python function) that the Node API
   routes call into. I'd lean Node for this given the rest of the stack —
   happy to wire it up once you confirm.

2. **Screenshot parsing endpoint** — `/api/parse-screenshot`, calls the
   Claude API with the image, returns a normalized entry. Not built yet;
   slots into the same `db.js` shape when you're ready for phase 2.

3. **Supabase connection** — `schema.sql` is ready to run, but the client
   doesn't push to it yet. Right now entries only live in IndexedDB on-device.

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

Charcoal-green base (`#12181A`), amber for readiness (`#D8A34E`), teal for
HR/zone data (`#4C8577`), warm red reserved only for pain flags (`#C1554A`)
so it never blends into the rest of the data. Fraunces for numbers/headers,
Inter for body, IBM Plex Mono for stats.
