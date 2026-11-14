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


async def test_unknown_patient_is_404(client):
    assert (await client.get("/patients/nope")).status_code == 404
