# server

Shared backend for the Cancer Pathway Companion: FastAPI + asyncpg on PostgreSQL, documents
stored as JSONB (ADR-0007). Unrelated to `backend/` (medml), which is never imported here.

Umbrella spec: `.scratch/pathway-companion/spec.md` (data contract, API surface, Finnish context).
Per-person specs: see `docs/handoff.md` at the repo root. Deployment: `docs/deploy.md`.

## Run

```bash
cd server
docker compose up -d                                 # local Postgres on :5432
python -m venv .venv && . .venv/Scripts/activate     # or source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/health                    # {"status":"ok","db":true,"current_demo_day":0}
```

Against Aiven instead of the local container: set `DATABASE_URL` to the service URI from the
Aiven console (it already carries `?sslmode=require`). Nothing else changes.

## Test

```bash
pytest
```

Tests use a throwaway schema on the local Postgres (unique name per session, dropped
afterwards) and stub every external client (Nemotron, ElevenLabs). No network.

## Layout

```
app/
  main.py          FastAPI app, CORS, router registration, startup schema + seed
  config.py        env vars (DATABASE_URL, ...) and secret loading (.secrets/ file or env var)
  db.py            asyncpg pool + document helpers: insert / upsert / get / find / fetch / update / append / truncate
  models/          one Pydantic model per collection = the data contract
  routers/         one file per URL prefix; owner named in each docstring
  rules/           versioned grading module (pure, no I/O)        person 3
  services/        logic the routers call; owner named per file
  fixtures/        hand-authored JSON seeded once + seed script
tests/             pytest, one file per area
Dockerfile         what Railway / Render build
compose.yaml       local Postgres
```

## Storage model

Every collection in the data contract is one table `(id text, created_at timestamptz, doc jsonb)`.
Use `db.find(table, {"field": value})` for equality filters (JSONB containment), `db.update` for
a shallow merge, `db.append` for list fields such as `trigger_event_ids` and `actions_taken`,
and `db.fetch(sql, ...)` with `doc->>'field'` for ranges. Pass documents as
`model.model_dump(mode="json", by_alias=True)`.

## Ownership

| Area | Owner |
|---|---|
| skeleton, db layer, models, `/demo/*`, promote, confirm, rules, worklist, alerts | person 3 |
| `POST /contacts`, `GET /contacts/{id}`, `GET /patients/{id}`, trusted-view, accessibility | person 2 |
| `/dashboard/*`, fixtures `counties` / `actions` / insight cards, simulation | person 1 |
| `/learn/*`, `/sim/*`, `/voice/*`, `send_sms`, `log_fhir_sync`, kanta-medicines | person 4 |
