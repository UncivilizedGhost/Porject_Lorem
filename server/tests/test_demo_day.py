"""Person 3: demo-day engine and demo shims (ADR-0004). Seam 1 (HTTP)."""

import pytest

pytestmark = pytest.mark.usefixtures("fresh_db")


async def test_advance_day_bumps_the_clock(client):
    r = await client.post("/demo/advance-day")
    assert r.status_code == 200
    assert r.json() == {"current_demo_day": 1, "fired": [], "nurse_calls": []}
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


# --- Simulated nurse call: a pending call-back is answered on the next demo day -------------

CONTACT = {
    "county": "Western Uusimaa",
    "language": "en",
    "display_name": "Matti K.",
    "consent": {"warning_sign_contact": True},
    "trusted_people": [{"name": "Liisa K.", "relationship": "daughter", "contact_method": "sms"}],
}


async def _contact_with_callback(client) -> str:
    cid = (await client.post("/contacts", json=CONTACT)).json()["_id"]
    r = await client.post(f"/contacts/{cid}/warning-sign-tap", json={"symptom": "chest_pain"})
    assert r.status_code == 200, r.text
    return cid


async def test_pending_callback_gets_a_nurse_call_on_the_next_day(client):
    cid = await _contact_with_callback(client)
    body = (await client.post("/demo/advance-day")).json()

    assert [c["contact_id"] for c in body["nurse_calls"]] == [cid]
    contact = (await client.get(f"/contacts/{cid}")).json()
    assert contact["callback"]["status"] == "booked"
    pid = contact["promoted_patient_id"]
    assert pid and body["nurse_calls"][0]["patient_id"] == pid


async def test_nurse_call_books_the_next_pathway_step_on_its_pathway_date(client):
    cid = await _contact_with_callback(client)
    await client.post("/demo/advance-day")
    pid = (await client.get(f"/contacts/{cid}")).json()["promoted_patient_id"]

    patient = (await client.get(f"/patients/{pid}")).json()
    nxt = patient["next_step"]
    appointments = (await client.get(f"/patients/{pid}/trusted-view")).json()["appointments"]
    assert len(appointments) == 1
    assert appointments[0]["at"].startswith(nxt["date"])
    assert appointments[0]["where"] == nxt["where"]
    assert appointments[0]["what"] == nxt["what"]


async def test_callback_already_handled_by_the_coordinator_gets_no_nurse_call(client):
    cid = await _contact_with_callback(client)
    await client.post(f"/contacts/{cid}/callback-handled", json={"status": "handled"})
    body = (await client.post("/demo/advance-day")).json()
    assert body["nurse_calls"] == []
    assert (await client.get(f"/contacts/{cid}")).json()["promoted_patient_id"] is None
