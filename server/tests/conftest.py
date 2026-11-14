"""Shared test fixtures.

Style follows backend/tests: hermetic, external clients stubbed, no network. The API tests
need a local mongod; they use a unique throwaway database per session and drop it afterwards.
"""

from __future__ import annotations

import contextlib
import os
import uuid

import pytest

os.environ.setdefault("MONGODB_URI", f"mongodb://localhost:27017/pathway_test_{uuid.uuid4().hex[:8]}")

from app import db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _drop_test_db():
    yield
    with contextlib.suppress(Exception):
        db.get_client().drop_database(db.get_db().name)


@pytest.fixture
async def client():
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
