# Example: Ship Council input for the retro tool

Use this as a test input for `@ship-council-orchestrator` when the retro tool from `examples/gmat-dashboard.md` (or your own equivalent) is partly built and you're trying to get it across the finish line.

## Goal

A weekly retro tool for myself. Monday SMS captures the week's 1–3 goals. Sunday 6pm SMS asks 3 LLM-generated questions grounded in those goals. Replies are stored as searchable notes.

## Time to ship

By next Sunday (one week).

## Audience

Just me.

## Current state

- Twilio outbound SMS works locally (tested with hardcoded message).
- Twilio inbound webhook receives replies and persists them to SQLite.
- LLM question generation works when given a goal string.
- Cron is set up via a local launchd plist — not yet on a server.
- No deploy target chosen.
- README is one line.
- No tests.

## Remaining backlog

- Decide where to host (Fly.io? Railway? GitHub Actions?)
- Set up env vars / secrets for production
- Wire the cron job to fire on Mondays and Sundays automatically
- Build the log view (HTML page with search)
- Add basic auth to the log view
- Write fallback questions if the LLM call fails
- Handle multi-segment SMS replies stitching
- Write the README properly

---

Paste the goal, time_to_ship, audience, current_state, and remaining_backlog into the orchestrator. The orchestrator will additionally read the actual repo state (git status, recent commits, README, deploy config) and feed everything into the audits.
