# Move — project context

Personal fitness/rehab tracker PWA. React \+ Vite frontend, Vercel serverless backend, IndexedDB local-first storage. Live at move-naeken.vercel.app.

## Status

v2 built: bold red/blue/yellow/white theme, 5-tab structure (General/Matches/Gym/Training/Padel — Padel's teal accent is a placeholder pending a real palette pass), `category` field on entries, `plans` library with `planId` linking, manual health metrics + device-only progress photos on the General tab. Match entries also carry venue/result/goalsScored/assists/stamina/confidence/touch/dryMouth/wentInGoal. Three new IndexedDB stores — `injuries`, `supplements`, `goals` — each with a collapsible card on the General tab. Garmin backend (api/garmin/auth.js, api/garmin/sync.js) is wired to the real `garmin-connect` npm package — login/sync work (verified against a live account), but that library doesn't yet support MFA-enabled Garmin accounts; it also only exposes activities, not VO2 max/wellness data (untested whether that's reachable via the same session tokens). A client-side `.xlsx` importer (`ImportTracker.jsx`, lazy-loaded) parses the user's real `Football_Fitness_Tracker.xlsx` into all of the above — verified end-to-end against the actual file, but the user still needs to run the import themselves on each device (IndexedDB is local-first, per-device — there's no server-side shortcut). Still open: screenshot-parsing endpoint (phase 2), pushing entries to Supabase (schema.sql is ready but unused), a real design/logo pass (explicitly deferred by the user), and a possible future Playtomic integration for Padel (mentioned as an idea, not scoped).

## v2 redesign — reference (implemented)

**Visual direction:** moving away from the dark "pitch-at-dusk" theme to a bold primary palette — red, blue, yellow, white. Graphic, striking, high contrast rather than moody.

**New tab structure** (replaces single flat entry list):

- **General** — health overview: VO2 max, sleep, weight (manual entry for now — Garmin only supplies activity data today, not daily wellness metrics), progress photos (device-only, stored in IndexedDB). Also shows a rolling summary from the last 5 sessions across ALL tabs, to give an at-a-glance "where am I at."  
- **Football Matches** — match logs: score, how the match felt, Garmin stats (HR, intensity vs last match — more or less intense than previous).  
- **Gym** — cardio \+ strength sessions, same log structure as Football Matches.  
- **Football Training** — freestyle, dribbling, cones, ball-work sessions. Distinct from Matches (lower intensity, skill-focused, but still worth tracking HR/duration and any pain flags).
- **Padel** — same generic session log as Gym/Training. User is on Playtomic for padel bookings/stats — possible future integration, not scoped yet.

**Workout plans:** `plans` entity — a library of saved workout plans. Each plan can be linked to a logged session (session gets a `planId` reference) so you can see "this session was Plan X" and track adherence over time.

**Historical data import:** done. The user's real Excel tracker (Football\_Fitness\_Tracker.xlsx, 6 tabs) is imported via the in-app importer on the General tab. Three of its six sheets didn't fit the original schema at all (Injury & Recovery, Supplements & Recovery, Goals & Progression) and are now first-class features rather than a lossy notes dump.

## Design constraints

- User is non-technical, iPhone-primary, uses this via PWA on mobile.  
- Keep components simple and readable — this is a personal app, not a product being shipped to other users (for now).  
- Garmin integration is the one piece that will always need real backend code — no shortcut, no official connector exists for this.

