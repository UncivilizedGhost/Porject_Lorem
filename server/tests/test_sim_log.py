"""Person 4. send_sms writes an sms_sent event with simulated: true visible in GET /sim/log;
a "YES" reply confirms the linked Escalation Step; log_fhir_sync writes a Bundle with one
resource and mock: true."""

import uuid

from app import db
from app.services.messaging import log_fhir_sync, send_sms


def _subject() -> str:
    return f"patient-{uuid.uuid4().hex[:8]}"


async def _log_for(client, subject_id: str) -> list[dict]:
    rows = (await client.get("/sim/log", params={"limit": 200})).json()
    return [r for r in rows if r["subject_id"] == subject_id]


async def test_send_sms_writes_a_simulated_sms_sent_event():
    pid = _subject()
    event_id = await send_sms("+358401234567", "Please confirm your CT on Tuesday", "patient", pid, "confirmation")
    event = await db.get("events", event_id)
    assert event["type"] == "sms_sent"
    assert (event["subject_type"], event["subject_id"]) == ("patient", pid)
    assert event["payload"] == {
        "to": "+358401234567",
        "text": "Please confirm your CT on Tuesday",
        "purpose": "confirmation",
        "channel": "sms",
        "simulated": True,
        "status": "sent",
    }


async def test_auto_call_channel_is_recorded_on_the_same_helper():
    pid = _subject()
    event_id = await send_sms("+358401234567", "Automated call", "patient", pid, "confirmation", channel="auto_call")
    assert (await db.get("events", event_id))["payload"]["channel"] == "auto_call"


async def test_sim_log_lists_sent_messages_newest_first(client):
    pid = _subject()
    await send_sms("+358401", "first", "patient", pid, "confirmation")
    await send_sms("+358401", "second", "patient", pid, "confirmation")
    rows = await _log_for(client, pid)
    assert [r["payload"]["text"] for r in rows] == ["second", "first"]
    assert all(r["payload"]["simulated"] is True for r in rows)
    assert all(r["id"] for r in rows)


async def test_sim_log_respects_limit_and_only_returns_sim_events(client):
    pid = _subject()
    await db.insert(
        "events",
        {"subject_type": "patient", "subject_id": pid, "type": "checkin", "payload": {}, "actor": "self",
         "input": "touch", "demo_day": 0},
    )
    for i in range(3):
        await send_sms("+358401", f"m{i}", "patient", pid, "confirmation")
    rows = (await client.get("/sim/log", params={"limit": 2})).json()
    assert len(rows) == 2
    assert {r["type"] for r in rows} <= {"sms_sent", "fhir_sync"}


async def test_log_fhir_sync_writes_a_mock_bundle_with_one_observation(client):
    pid = _subject()
    event_id = await log_fhir_sync("patient", pid, {"display": "Temperature", "value": 38.6, "unit": "Cel"})
    event = await db.get("events", event_id)
    assert event["type"] == "fhir_sync"
    assert event["payload"]["mock"] is True
    bundle = event["payload"]["bundle"]
    assert bundle["resourceType"] == "Bundle" and bundle["type"] == "collection"
    assert len(bundle["entry"]) == 1
    resource = bundle["entry"][0]["resource"]
    assert resource["resourceType"] == "Observation"
    assert resource["valueQuantity"]["value"] == 38.6
    assert [r["id"] for r in await _log_for(client, pid)] == [event_id]


async def test_log_fhir_sync_can_describe_a_medication_statement():
    pid = _subject()
    event_id = await log_fhir_sync(
        "patient", pid, {"resource_type": "MedicationStatement", "display": "Cancer medicine, tablets, morning"}
    )
    resource = (await db.get("events", event_id))["payload"]["bundle"]["entry"][0]["resource"]
    assert resource["resourceType"] == "MedicationStatement"
    assert resource["medicationCodeableConcept"]["text"] == "Cancer medicine, tablets, morning"


async def _escalation(pid: str) -> tuple[str, str]:
    first = await db.insert(
        "escalation_steps",
        {"patient_id": pid, "step_index": 0, "rung": "message_sms", "due_demo_day": 0,
         "fired_at": "2026-11-14T08:00:00", "confirmed_at": None},
    )
    later = await db.insert(
        "escalation_steps",
        {"patient_id": pid, "step_index": 1, "rung": "auto_call", "due_demo_day": 2, "fired_at": None,
         "confirmed_at": None},
    )
    return first, later


async def test_reply_writes_a_linked_replied_row(client):
    pid = _subject()
    sent = await send_sms("+358401", "Confirm?", "patient", pid, "confirmation")
    r = await client.post(f"/sim/sms/{sent}/reply", json={"text": "maybe later"})
    assert r.status_code == 200
    rows = await _log_for(client, pid)
    reply = next(x for x in rows if x["payload"]["status"] == "replied")
    assert reply["payload"]["text"] == "maybe later"
    assert reply["payload"]["reply_to"] == sent
    assert reply["payload"]["simulated"] is True


async def test_yes_reply_confirms_the_fired_step_and_later_unfired_steps(client):
    pid = _subject()
    first, later = await _escalation(pid)
    sent = await send_sms("+358401", "Confirm?", "patient", pid, "confirmation")
    r = await client.post(f"/sim/sms/{sent}/reply", json={"text": " Yes "})
    assert r.json()["confirmed"] is True
    assert (await db.get("escalation_steps", first))["confirmed_at"]
    assert (await db.get("escalation_steps", later))["confirmed_at"]


async def test_other_reply_does_not_confirm(client):
    pid = _subject()
    first, _ = await _escalation(pid)
    sent = await send_sms("+358401", "Confirm?", "patient", pid, "confirmation")
    r = await client.post(f"/sim/sms/{sent}/reply", json={"text": "no"})
    assert r.json()["confirmed"] is False
    assert (await db.get("escalation_steps", first))["confirmed_at"] is None


async def test_reply_to_unknown_message_is_404(client):
    r = await client.post("/sim/sms/does-not-exist/reply", json={"text": "YES"})
    assert r.status_code == 404
