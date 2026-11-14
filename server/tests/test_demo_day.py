"""Person 3: demo-day engine and demo shims (ADR-0004). Seam 1 (HTTP)."""

import pytest

pytestmark = pytest.mark.usefixtures("fresh_db")


async def test_advance_day_bumps_the_clock(client):
    r = await client.post("/demo/advance-day")
    assert r.status_code == 200
    assert r.json() == {"current_demo_day": 1, "fired": []}
    r = await client.post("/demo/advance-day")
    assert r.json()["current_demo_day"] == 2


async def test_identities_names_the_seeded_coordinator(client):
    body = (await client.get("/demo/identities")).json()
    assert body["coordinator_id"]
    assert body["contact_id"] is None
    assert body["patient_id"] is None
    assert body["current_demo_day"] == 0


async def test_reset_returns_the_clock_to_day_zero(client):
    await client.post("/demo/advance-day")
    r = await client.post("/demo/reset")
    assert r.status_code == 200
    assert (await client.get("/demo/identities")).json()["current_demo_day"] == 0
