"""Demo admission: at most MAX_CLIENTS browsers at once, by X-Client-Id; /health always open."""

import pytest

from app.services import client_slots


@pytest.fixture
def five_slots(monkeypatch):
    monkeypatch.setattr("app.config.MAX_CLIENTS", 5)
    monkeypatch.setattr("app.config.CLIENT_IDLE_S", 120)
    client_slots.clear()
    yield
    client_slots.clear()


async def test_sixth_browser_is_refused_while_five_are_active(five_slots, client):
    for n in range(5):
        r = await client.get("/rules", headers={"X-Client-Id": f"browser-{n}"})
        assert r.status_code == 200

    assert (await client.get("/rules", headers={"X-Client-Id": "browser-6"})).status_code == 503
    assert (await client.get("/rules", headers={"X-Client-Id": "browser-0"})).status_code == 200


async def test_request_without_a_client_id_is_refused(five_slots, client):
    assert (await client.get("/rules")).status_code == 503


async def test_health_is_open_to_everyone(five_slots, client):
    assert (await client.get("/health")).status_code == 200


def test_an_idle_browser_frees_its_slot(five_slots):
    for n in range(5):
        assert client_slots.admit(f"browser-{n}", now=0)

    assert not client_slots.admit("late", now=60)
    assert client_slots.admit("late", now=121)
