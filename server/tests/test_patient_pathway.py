"""Person 2, seam 1 (HTTP): GET /patients/{id} derived blocks, trusted view, accessibility.

Promotion (person 3) and advance-day are still 501 on this branch, so the tests insert the
documents those endpoints would write (patients, escalation_steps, events) straight into the
throwaway schema and move the clock by updating `pathway_clock`.
"""

from __future__ import annotations

from app import db

TRUSTED = [
    {"name": "Liisa Virtanen", "relationship": "daughter", "contact_method": "sms",
     "consented_at": "2026-11-14T08:00:00+00:00"},
]
ACCESS = {"read_aloud": True, "voice_mode": False, "text_size": "l", "high_contrast": True}


async def make_patient(day=0, started=0, phase="suspected_cancer"):
    return await db.insert(
        "patients",
        {
            "contact_id": "c1",
            "county": "Western Uusimaa",
            "demographics": {"age": 68, "language": "en", "education_group": "basic",
                             "municipality_type": "urban"},
            "coordinator_id": "co1",
            "referral": {"flagged_by": "co1", "source": "health_station",
                         "at": "2026-11-14T08:00:00+00:00"},
            "phase": phase,
            "pathway_clock": {"started_demo_day": started, "current_demo_day": day},
            "trusted_people": TRUSTED,
            "accessibility": ACCESS,
            "language": "en",
        },
    )


async def set_day(patient_id, day):
    patient = await db.get("patients", patient_id)
    clock = {**patient["pathway_clock"], "current_demo_day": day}
    await db.update("patients", patient_id, {"pathway_clock": clock})


def states(body):
    return {s["id"]: s["state"] for s in body["pathway_steps"]}


async def test_patient_carries_copied_settings_and_the_pathway_steps(client):
    pid = await make_patient()
    res = await client.get(f"/patients/{pid}")
    assert res.status_code == 200
    body = res.json()
    assert body["accessibility"] == ACCESS
    assert body["trusted_people"] == TRUSTED
    assert states(body) == {
        "health_station_xray": "done",
        "referral_lung_clinic": "done",
        "chest_ct": "next",
        "bronchoscopy": "later",
        "treatment_plan": "later",
        "first_treatment": "later",
    }
    ct = next(s for s in body["pathway_steps"] if s["id"] == "chest_ct")
    assert ct["location"] == "Jorvi Hospital, Espoo (HUS imaging)"
    assert ct["date"].startswith("2026-11-21")  # referral 14.11. + 7 days
    assert ct["date_is_estimate"] is True


async def test_steps_and_status_change_as_demo_days_pass(client):
    pid = await make_patient(day=3, started=3)
    body = (await client.get(f"/patients/{pid}")).json()
    assert body["status"] == "on_track"
    assert states(body)["chest_ct"] == "next"

    await set_day(pid, 3 + 7)  # chest CT day: still the current step, not yet past
    body = (await client.get(f"/patients/{pid}")).json()
    assert body["status"] == "on_track"

    await set_day(pid, 3 + 8)  # one day past its expected day
    body = (await client.get(f"/patients/{pid}")).json()
    assert body["status"] == "running_late"
    assert states(body)["chest_ct"] == "next"

    await set_day(pid, 3 + 9)  # done; bronchoscopy is now the current step
    body = (await client.get(f"/patients/{pid}")).json()
    assert states(body)["chest_ct"] == "done"
    assert states(body)["bronchoscopy"] == "next"
    assert body["status"] == "on_track"


async def test_an_unconfirmed_fired_escalation_step_means_running_late(client):
    pid = await make_patient(day=2)
    await db.insert("escalation_steps", {
        "patient_id": pid, "step_index": 1, "rung": "auto_call", "due_demo_day": 2,
        "fired_at": "2026-11-16T08:00:00+00:00", "confirmed_at": None,
    })
    assert (await client.get(f"/patients/{pid}")).json()["status"] == "running_late"


async def test_next_step_says_what_when_where_and_what_to_bring(client):
    pid = await make_patient()
    next_step = (await client.get(f"/patients/{pid}")).json()["next_step"]
    assert next_step["what"] == "Chest CT"
    assert next_step["where"] == "Jorvi Hospital, Espoo (HUS imaging)"
    assert next_step["date"].startswith("2026-11-21")
    assert next_step["time"] == "09.30"
    assert "Kela card" in next_step["what_to_bring"]
    assert next_step["pending_confirmation"] is None


async def test_next_step_exposes_the_open_confirmation(client):
    pid = await make_patient(day=0)
    await db.insert("escalation_steps", {
        "patient_id": pid, "step_index": 1, "rung": "auto_call", "due_demo_day": 2,
        "fired_at": None, "confirmed_at": None,
    })
    step0 = await db.insert("escalation_steps", {
        "patient_id": pid, "step_index": 0, "rung": "message_sms", "due_demo_day": 0,
        "fired_at": "2026-11-14T08:00:00+00:00", "confirmed_at": None,
    })
    pending = (await client.get(f"/patients/{pid}")).json()["next_step"]["pending_confirmation"]
    assert pending == {"id": step0, "kind": "appointment"}

    await db.update("escalation_steps", step0, {"confirmed_at": "2026-11-14T09:00:00+00:00"})
    pending = (await client.get(f"/patients/{pid}")).json()["next_step"]["pending_confirmation"]
    assert pending is None  # step 1 is not due until day 2


async def test_medicines_are_generic_labels_without_drug_names(client):
    pid = await make_patient()
    medicines = (await client.get(f"/patients/{pid}")).json()["medicines"]
    assert [m["label"] for m in medicines][0] == "Cancer medicine, tablets, morning"
    assert all(set(m) >= {"id", "label", "time_critical"} for m in medicines)


async def test_unknown_patient_is_404(client):
    assert (await client.get("/patients/nope")).status_code == 404
