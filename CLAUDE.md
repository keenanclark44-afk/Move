# Move — project context

Personal fitness/rehab tracker PWA. React \+ Vite frontend, Vercel serverless backend, IndexedDB local-first storage. Live at move-naeken.vercel.app.

## Status

v1 deployed and working: manual entry logging, offline storage, installable PWA. Garmin connect button is a stub (api/garmin/auth.js, api/garmin/sync.js need the real `garmin-connect` npm package wired in — no official API exists, this is the standard community approach).

## v2 redesign — in progress, not yet built

**Visual direction:** moving away from the dark "pitch-at-dusk" theme to a bold primary palette — red, blue, yellow, white. Graphic, striking, high contrast rather than moody.

**New tab structure** (replaces single flat entry list):

- **General** — health overview: VO2 max trend (%, from Garmin), sleep, weight, progress photos (monthly). Also shows a rolling summary from the last 3–5 sessions across ALL tabs, to give an at-a-glance "where am I at."  
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

