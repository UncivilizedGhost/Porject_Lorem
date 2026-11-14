# Handoff: who builds what, where

Four people, one 8-hour build, one integration branch. Everyone reads the umbrella spec once
(`.scratch/pathway-companion/spec.md`: decisions, Finnish context, data contract, API surface),
then works from their own spec. `backend/` (medml) is unrelated and untouched.

| Person | Spec | Owns |
|---|---|---|
| 1 | `.scratch/equity-dashboard/spec.md` | `frontend-healthcare-provider/` shell (login, demo bar, routes) and `src/features/dashboard/`; `server/app/routers/dashboard.py`, `services/simulation.py`, `services/summary_filter.py`, fixtures `counties.json` / `actions.json` / `insight_cards.json` |
| 2 | `.scratch/patient-companion/spec.md` | `frontend-patient/` (shell, tokens, all screens except Learn), registering voice actions on every screen; `server/app/routers/contacts.py` (create/read/accessibility), `routers/patients.py` (read/trusted-view/accessibility), `services/risk_check.py`, `services/pathway.py`, fixtures `medicines.json` / `pathway_template.json` |
| 3 | `.scratch/coordinator-worklist/spec.md` | `server/` skeleton, `models/`, `routers/demo.py`, promote / confirm / warning-sign-tap / checkin / symptom-report / medication-log, `rules/`, `services/worklist.py`, `routers/alerts.py`, `routers/worklist.py`, `routers/rules.py`; `frontend-healthcare-provider/src/features/worklist/`; Booking (stretch) |
| 4 | `.scratch/learn-sms-fhir-voice/spec.md` | `server/app/services/messaging.py` (`send_sms`, `log_fhir_sync`), `services/learn/`, `services/voice.py`, `services/nemotron.py` (shared with person 1), `routers/learn.py` / `sim.py` / `voice.py`, kanta-medicines, `learn_corpus.json`; `frontend-patient/src/voice/` and `screens/Learn/`; `frontend-healthcare-provider/src/features/simlog/` |

## Hour 1 (unblocks everyone)

- Person 3: `server/` runs, `GET /health` answers, `clock_state` seeded, every router stub
  returns 501 (already scaffolded) → replace with contract-shaped fixed data.
- Person 4: `send_sms` / `log_fhir_sync` keep their final signatures (already scaffolded as no-ops).
- Person 1: provider-app shell, login, demo bar (scaffolded) → person 3 adds Worklist routes.
- Person 2: patient-app shell, tokens, login, demo bar (scaffolded); the no-op voice hooks in
  `src/voice/` let screens register actions before person 4's layer lands.

## Conventions

- Every file names its owner and spec in its header. Touch another person's file only for a
  one-line route registration or import; otherwise ask.
- The database stores ISO values; Finnish formats (18.11., 9.30, 38,6 °C) only in `lib/format.ts`.
- Storage is PostgreSQL with one JSONB document table per collection (ADR-0007); go through
  the helpers in `server/app/db.py`, not raw SQL, except for range filters.
- The server computes `grade` / `rule` / `advice_shown` / `risk_group`; clients never send them.
- Every write carries `actor` and `input`; the patient API client sets `input: "voice"` itself.
- Secrets live in `.secrets/` (see `.env.example`); nothing reaches a frontend bundle.
- Tests: pytest in `server/tests/` (throwaway Postgres schema, external clients stubbed),
  Vitest + Testing Library in each app (API client mocked). Test files per seam are stubbed
  with the cases from each spec's "Testing Decisions".

## Run everything

```bash
cd server && docker compose up -d                 # local Postgres; or set DATABASE_URL to Aiven
pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000
cd frontend-patient && npm install && npm run dev               # :5173
cd frontend-healthcare-provider && npm install && npm run dev   # :5174
```

Both dev servers proxy `/api/*` to `:8000`. Hosting (Aiven + Railway, laptop fallback,
pre-demo checklist): `docs/deploy.md`.
