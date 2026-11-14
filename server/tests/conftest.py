"""Shared test fixtures.

Style follows backend/tests: hermetic, external clients stubbed, no network. The API tests
need a local Postgres (`docker compose up -d` in server/); they use a throwaway schema per
session (`PATHWAY_DB_SCHEMA=test_<hex>`) and drop it afterwards.
"""

from __future__ import annotations

import contextlib
import os
import uuid

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql://pathway:pathway@localhost:5432/pathway")
os.environ["PATHWAY_DB_SCHEMA"] = f"test_{uuid.uuid4().hex[:8]}"

from app import config, db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def _throwaway_schema():
    with contextlib.suppress(Exception):  # no Postgres → tests that need it fail on their own
        await db.init_schema()
    yield
    with contextlib.suppress(Exception):
        pool = await db.get_pool()
        await pool.execute(f'DROP SCHEMA IF EXISTS "{config.DB_SCHEMA}" CASCADE')
        await db.close_pool()


@pytest.fixture
async def client():
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
