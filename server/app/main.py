"""FastAPI application entry point.

Owner: person 3 (skeleton). Every other builder adds a router here and nothing else.
Run: `uvicorn app.main:app --reload --port 8000`
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Creates the JSONB tables if missing (ADR-0007), then seeds clock_state, the demo
    # Coordinator and the fixtures if missing (ADR-0004).
    try:
        await db.init_schema()
        await ensure_seeded()
    except Exception as exc:  # noqa: BLE001 - the server still starts; /health reports db: false
        print(f"[startup] database not reachable, skipping schema + seed: {exc}")
    # TODO(person 4): log loudly if the ElevenLabs key is missing (ADR-0005).
    yield
    await db.close_pool()


app = FastAPI(title="Cancer Pathway Companion API", version="0.1.0", lifespan=lifespan)

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
