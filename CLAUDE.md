# Move — project context

Personal fitness/rehab tracker PWA. React \+ Vite frontend, Vercel serverless backend, IndexedDB local-first storage. Live at move-naeken.vercel.app.

## Status

v2 built: bold red/blue/yellow/white theme, 4-tab structure (General/Matches/Gym/Training), `category` field on entries, `plans` library with `planId` linking, manual health metrics + device-only progress photos on the General tab. Garmin backend (api/garmin/auth.js, api/garmin/sync.js) is wired to the real `garmin-connect` npm package — login/sync work, but that library doesn't yet support MFA-enabled Garmin accounts. Still open: screenshot-parsing endpoint (phase 2), pushing entries to Supabase (schema.sql is ready but unused), and the historical Excel import below.

## v2 redesign — reference (implemented)

**Visual direction:** moving away from the dark "pitch-at-dusk" theme to a bold primary palette — red, blue, yellow, white. Graphic, striking, high contrast rather than moody.

**New tab structure** (replaces single flat entry list):

- **General** — health overview: VO2 max, sleep, weight (manual entry for now — Garmin only supplies activity data today, not daily wellness metrics), progress photos (device-only, stored in IndexedDB). Also shows a rolling summary from the last 5 sessions across ALL tabs, to give an at-a-glance "where am I at."  
- **Football Matches** — match logs: score, how the match felt, Garmin stats (HR, intensity vs last match — more or less intense than previous).  
- **Gym** — cardio \+ strength sessions, same log structure as Football Matches.  
- **Football Training** — freestyle, dribbling, cones, ball-work sessions. Distinct from Matches (lower intensity, skill-focused, but still worth tracking HR/duration and any pain flags).

**Schema change needed:** entries need a `category` field (`match | gym | training | general`) alongside the existing shared fields (date, duration, distance, avgHr, hrZones, painFlags, notes, source).

**Workout plans:** new `plans` entity — a library of saved workout plans. Each plan can be linked to a logged session (session gets a `planId` reference) so you can see "this session was Plan X" and track adherence over time.

**Historical data import:** user has an existing Excel tracker (Football\_Fitness\_Tracker.xlsx, 6 tabs) with match/session history that should be imported as the foundational dataset once available via Google Drive connector.

## Design constraints

- User is non-technical, iPhone-primary, uses this via PWA on mobile.  
- Keep components simple and readable — this is a personal app, not a product being shipped to other users (for now).  
- Garmin integration is the one piece that will always need real backend code — no shortcut, no official connector exists for this.

