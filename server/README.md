# server

Shared backend for the Cancer Pathway Companion: FastAPI + Motor (async PyMongo) on MongoDB.
Unrelated to `backend/` (medml), which is never imported here.

Umbrella spec: `.scratch/pathway-companion/spec.md` (data contract, API surface, Finnish context).
Per-person specs: see `docs/handoff.md` at the repo root.

## Run

```bash
cd server
python -m venv .venv && . .venv/Scripts/activate   # or source .venv/bin/activate
pip install -e ".[dev]"
# local mongod must be running; override with MONGODB_URI (ADR-0001)
uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/health
```

## Test

```bash
pytest
```

Tests use a throwaway database on local Mongo (unique name per session, dropped afterwards)
and stub every external client (Nemotron, ElevenLabs). No network.

## Layout

```
app/
  main.py          FastAPI app, CORS, router registration, startup seed
  config.py        env vars (MONGODB_URI, ...) and secret-file loading
  db.py            Motor client and collection accessors
  models/          one Pydantic model per collection = the data contract
  routers/         one file per URL prefix; owner named in each docstring
  rules/           versioned grading module (pure, no I/O)        person 3
  services/        logic the routers call; owner named per file
  fixtures/        hand-authored JSON seeded once + seed script
tests/             pytest, one file per area
```

## Ownership

| Area | Owner |
|---|---|
| skeleton, models, `/demo/*`, promote, confirm, rules, worklist, alerts | person 3 |
| `POST /contacts`, `GET /contacts/{id}`, `GET /patients/{id}`, trusted-view, accessibility | person 2 |
| `/dashboard/*`, fixtures `counties` / `actions` / insight cards, simulation | person 1 |
| `/learn/*`, `/sim/*`, `/voice/*`, `send_sms`, `log_fhir_sync`, kanta-medicines | person 4 |
