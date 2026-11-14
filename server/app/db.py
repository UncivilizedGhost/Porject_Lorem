"""Motor client and collection accessors.

One client per process. Collections are named exactly as in the umbrella data contract.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase

from app import config

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(config.MONGODB_URI, serverSelectionTimeoutMS=2000)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client().get_default_database()


# Runtime collections (cleared by POST /demo/reset)
def contacts() -> AsyncIOMotorCollection: return get_db()["contacts"]
def patients() -> AsyncIOMotorCollection: return get_db()["patients"]
def events() -> AsyncIOMotorCollection: return get_db()["events"]
def alerts() -> AsyncIOMotorCollection: return get_db()["alerts"]
def escalation_steps() -> AsyncIOMotorCollection: return get_db()["escalation_steps"]
def appointments() -> AsyncIOMotorCollection: return get_db()["appointments"]
def decisions() -> AsyncIOMotorCollection: return get_db()["decisions"]

# Seeded on startup
def coordinators() -> AsyncIOMotorCollection: return get_db()["coordinators"]
def clock_state() -> AsyncIOMotorCollection: return get_db()["clock_state"]

# Fixtures (seeded once, never written at runtime)
def counties() -> AsyncIOMotorCollection: return get_db()["counties"]
def actions() -> AsyncIOMotorCollection: return get_db()["actions"]
def clinicians() -> AsyncIOMotorCollection: return get_db()["clinicians"]
