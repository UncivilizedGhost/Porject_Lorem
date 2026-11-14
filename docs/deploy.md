# Deployment

Three things need hosting: the database, the server and two static frontends. Deploy early
(hour 2, with the 501 stubs) and redeploy on every merge; never deploy for the first time
before the demo.

## Database: Aiven for PostgreSQL (ADR-0007)

1. Aiven console → Create service → PostgreSQL, free plan, region `europe-north1` (Finland)
   or the nearest EU region.
2. Copy the **Service URI** (`postgres://avnadmin:…@…aivencloud.com:…/defaultdb?sslmode=require`).
3. That URI is `DATABASE_URL` everywhere below. The server creates its tables on startup.

Local development uses `server/compose.yaml` instead; nobody needs Aiven credentials to build.

## Server + frontends: Railway (one project, one login)

| Service | Source | Settings |
|---|---|---|
| `server` | `server/Dockerfile` | Variables: `DATABASE_URL`, `CORS_ORIGINS` (the two frontend URLs), `NEMOTRON_BASE_URL`, `NEMOTRON_MODEL`, `VERDA_INFERENCE_KEY`, `ELEVENLABS_KEY` |
| `patient` | `frontend-patient/`, build `npm ci && npm run build`, serve `dist/` | Static. Rewrite `/api/(.*)` → `https://<server>/$1` |
| `provider` | `frontend-healthcare-provider/`, same | Static. Same rewrite |

Secrets: `config.read_secret("verda_inference_key")` reads `.secrets/verda_inference_key`
locally and falls back to the env var `VERDA_INFERENCE_KEY` when hosted; the same for
`elevenlabs_key` / `ELEVENLABS_KEY`. Keys never reach a frontend bundle.

Render + Vercel work the same way if someone prefers them; the Dockerfile and the `/api`
rewrite are the only contract.

## Fallback: presenter laptop + tunnel

Postgres container, `uvicorn`, two `vite preview`, then
`cloudflared tunnel --url http://localhost:<port>` for 5173, 5174 and 8000 (no account
needed, HTTPS, works on any Wi-Fi; phones need HTTPS for the microphone). Set
`CORS_ORIGINS` to the two tunnel URLs. Keep this ready even if the hosted version works.

## Pre-demo checklist

- `GET /health` on the hosted server returns `"db": true` (wakes a sleeping free tier).
- `POST /demo/reset`, then the demo-day counter is 0 on every screen.
- Open each companion screen once with Read-aloud on so the TTS cache is warm.
- Phones: patient and Trusted Person both logged in, Voice Mode on for the patient.
- Laptop: Worklist and Dashboard tabs open, SMS/FHIR log in a third tab.
