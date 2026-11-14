Status: ready-for-human

# Shared infra: Mongo schema, FastAPI skeleton, demo-day engine, fake login

Owner: whoever's free first (no fixed role — see spec.md). Everyone else is blocked on the bare minimum of this.

## Tasks

1. Stand up `server/` (FastAPI + Motor). Connect to local `mongod` via `MONGODB_URI` env var (default `mongodb://localhost:27017/pathway`). Do not hardcode Atlas anywhere yet (ADR-0001).
2. Create the collections in `.scratch/pathway-companion/spec.md`'s data contract as Pydantic models + Motor collection wrappers. No migrations needed — Mongo is schemaless, the Pydantic layer is the real contract.
3. Seed `clock_state` with `{ _id: "demo", current_demo_day: 0 }` on startup if missing.
4. Implement `POST /demo/advance-day`: increments `clock_state.current_demo_day`, then for every Patient with an open `escalation_steps` entry whose `due_demo_day <= current_demo_day` and `fired_at` is null, set `fired_at = now`. This is the only scheduling mechanism in the build (ADR-0004) — no cron, no background worker.
5. Implement `POST /contacts/{id}/promote`: creates the Patient document, sets `pathway_clock.started_demo_day = clock_state.current_demo_day`, creates the 5 `escalation_steps` rows (due days 0/2/3/5/7 relative to `started_demo_day`) for the first pending confirmation.
6. Build the fake-login screen (frontend, but blocks everyone's routing): a static page with a neutral "strong identification (mocked)" placeholder (no Suomi.fi or Omapolku branding) and 4 buttons — Patient, Trusted Person, Coordinator, County viewer — each just sets a role in local state and routes to `/companion`, `/companion` (trusted-person view), `/worklist`, `/dashboard` respectively. No backend call.
7. Expose `GET /health` for the other three builders to sanity-check the server is up.
8. Build the shared demo bar: a thin dark strip on top of every screen in all three apps showing `clock_state.current_demo_day` and an "Advance one day" button that calls `POST /demo/advance-day`. Clearly labelled as demo-only.
9. Add the `accessibility` field to Contacts and Patients (copied at promotion) and the two `PATCH .../accessibility` endpoints from the spec.

## Acceptance

- `POST /contacts` → `POST /contacts/{id}/promote` → `GET /patients/{id}` round-trips.
- Calling `/demo/advance-day` 7 times in a row fires all 5 escalation rungs in the right order for a freshly promoted Patient with no Confirmation.
- The other 3 builders can start against this without touching `server/`'s internals.
