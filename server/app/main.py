"""FastAPI application entry point.

Owner: person 3 (skeleton). Every other builder adds a router here and nothing else.
Run: `uvicorn app.main:app --reload --port 8000`
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app import config, db
from app.fixtures.seed import ensure_seeded
from app.routers import (
    alerts,
    booking,
    contacts,
    dashboard,
    demo,
    escalation_steps,
    health,
    learn,
    patients,
    rules,
    sim,
    voice,
    worklist,
)
from app.services import client_slots
from app.services import voice as voice_service
from app.services.learn import corpus, pregenerated


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Creates the JSONB tables if missing (ADR-0007), then seeds clock_state, the demo
    # Coordinator and the fixtures if missing (ADR-0004).
    try:
        await db.init_schema()
        await ensure_seeded()
        await corpus.refresh()
        await pregenerated.refresh()
    except Exception as exc:  # noqa: BLE001 - the server still starts; /health reports db: false
        target = urlsplit(config.DATABASE_URL)
        print(f"[startup] database not reachable at {target.hostname}:{target.port}, skipping schema + seed: {exc}")
    if warning := voice_service.startup_warning():
        print(warning)
    yield
    await db.close_pool()


app = FastAPI(title="Cancer Pathway Companion API", version="0.1.0", lifespan=lifespan)

@app.middleware("http")
async def admit_demo_clients(request: Request, call_next):
    # /health stays open for uptime checks; preflights carry no custom headers.
    if request.method == "OPTIONS" or request.url.path == "/health":
        return await call_next(request)
    if not client_slots.admit(request.headers.get("x-client-id")):
        return JSONResponse({"detail": "demo full, try again in a few minutes"}, status_code=503)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(demo.router)            # person 3
app.include_router(contacts.router)        # person 2 + person 3
app.include_router(patients.router)        # person 2 + person 3 + person 4
app.include_router(escalation_steps.router)  # person 3
app.include_router(alerts.router)          # person 3
app.include_router(worklist.router)        # person 3
app.include_router(rules.router)           # person 3
app.include_router(dashboard.router)       # person 1
app.include_router(sim.router)             # person 4
app.include_router(learn.router)           # person 4
app.include_router(voice.router)           # person 4
app.include_router(booking.router)         # person 3 (stretch)
