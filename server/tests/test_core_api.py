"""Person 3, seam 1 (HTTP). See .scratch/coordinator-worklist/spec.md → Testing Decisions."""

import pytest

pytestmark = pytest.mark.usefixtures("fresh_db")

CONTACT = {
    "county": "Western Uusimaa",
    "language": "fi",
    "display_name": "Matti K.",
    "phone": "+358 40 123 4567",
    "consent": {"warning_sign_contact": True},
    "trusted_people": [{"name": "Liisa K.", "relationship": "daughter", "contact_method": "sms"}],
    "accessibility": {"text_size": "l"},
}


async def make_contact(client) -> str:
    r = await client.post("/contacts", json=CONTACT)
    assert r.status_code in (200, 201), r.text
    return r.json()["_id"]


async def make_patient(client) -> str:
    cid = await make_contact(client)
    r = await client.post(f"/contacts/{cid}/promote")
    assert r.status_code == 200, r.text
    return r.json()["patient_id"]


async def test_promote_round_trips_into_a_patient(client):
    cid = await make_contact(client)
    r = await client.post(f"/contacts/{cid}/promote")
    pid = r.json()["patient_id"]

    p = (await client.get(f"/patients/{pid}")).json()
    assert p["contact_id"] == cid
    assert p["county"] == "Western Uusimaa"
    assert p["phase"] == "suspected_cancer"
    assert p["pathway_clock"] == {"started_demo_day": 0, "current_demo_day": 0}
    assert p["referral"]["source"] == "worklist"
    assert p["trusted_people"][0]["name"] == "Liisa K."
    assert p["accessibility"]["text_size"] == "l"
    assert p["next_step"]["pending_confirmation"]["id"]

    contact = (await client.get(f"/contacts/{cid}")).json()
    assert contact["promoted_patient_id"] == pid


async def test_promote_twice_returns_the_same_patient(client):
    cid = await make_contact(client)
    first = (await client.post(f"/contacts/{cid}/promote")).json()["patient_id"]
    second = (await client.post(f"/contacts/{cid}/promote")).json()["patient_id"]
    assert first == second


async def test_seven_advances_fire_all_five_rungs_in_order(client):
    pid = await make_patient(client)
    fired = []
    for _ in range(7):
        body = (await client.post("/demo/advance-day")).json()
        fired += [f["rung"] for f in body["fired"] if f["patient_id"] == pid]
    assert fired == ["message_sms", "auto_call", "nurse_call", "trusted_person", "flag_health_centre"]


async def test_each_rung_fires_only_on_its_due_day(client):
    pid = await make_patient(client)
    by_day = {}
    for day in range(1, 8):
        body = (await client.post("/demo/advance-day")).json()
        by_day[day] = [f["step_index"] for f in body["fired"] if f["patient_id"] == pid]
    assert by_day == {1: [0], 2: [1], 3: [2], 4: [], 5: [3], 6: [], 7: [4]}


async def test_confirmation_on_day_one_stops_later_rungs(client):
    pid = await make_patient(client)
    await client.post("/demo/advance-day")
    step_id = (await client.get(f"/patients/{pid}")).json()["next_step"]["pending_confirmation"]["id"]
    r = await client.post(f"/escalation-steps/{step_id}/confirm", json={"actor": "self", "input": "touch"})
    assert r.status_code == 200
    for _ in range(6):
        body = (await client.post("/demo/advance-day")).json()
        assert [f for f in body["fired"] if f["patient_id"] == pid] == []


async def test_trusted_person_confirmation_is_logged_as_proxy(client):
    pid = await make_patient(client)
    step_id = (await client.get(f"/patients/{pid}")).json()["next_step"]["pending_confirmation"]["id"]
    r = await client.post(
        f"/escalation-steps/{step_id}/confirm",
        json={"actor": "trusted_person", "trusted_person_name": "Liisa K.", "input": "voice"},
    )
    assert r.status_code == 200
    assert r.json()["actor"] == "trusted_person"
