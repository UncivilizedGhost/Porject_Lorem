# Cancer Pathway Companion (Junction 2026)

One companion for a person on a suspected lung cancer pathway, one Worklist for the
Coordinator who follows them, one Equity Dashboard for the county. Demo county Western Uusimaa,
synthetic figures, Finnish services, UI text in English.

| Directory | What |
|---|---|
| `server/` | Shared FastAPI backend, PostgreSQL/JSONB on Aiven |
| `frontend-patient/` | The companion: Contacts, Patients, Trusted People (React + Vite) |
| `frontend-healthcare-provider/` | Worklist, Equity Dashboard, simulated SMS / FHIR log (React + Vite) |
| `backend/` | `medml`, an unrelated ML template; not used by the above |
| `docs/` | ADRs, research, agent conventions, `handoff.md` (who builds what) |
| `.scratch/` | Specs and issues (local markdown issue tracker) |

Start with `docs/handoff.md`, then your spec under `.scratch/`. Plan:
`Cancer Pathway Companion – MVP Plan (Junction 2026).md`. Vocabulary: `GLOSSARY.md`.
