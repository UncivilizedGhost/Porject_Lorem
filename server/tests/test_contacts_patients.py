"""Person 2, seam 1 (HTTP). See .scratch/patient-companion/spec.md → Testing Decisions.

- risk-check eligibility at the boundaries (age 49/50/74/75, 15 vs 16 cigarettes for 25 vs 26
  years, 10/30, former smoker, never smoked, non-pilot county)
- POST /contacts → promote → GET /patients/{id} carries copied accessibility and Trusted People
- pathway_steps and status change after advance-day
- trusted-view never contains Check-in or Symptom Report answers
- the accessibility PATCH is partial
"""

import pytest

ELIGIBLE = {
    "age": 60,
    "smoking_status": "daily",
    "cigarettes_per_day": 20,
    "years_smoked": 30,
}


def contact_body(county="Western Uusimaa", **answers):
    return {
        "county": county,
        "language": "en",
        "consent": {"warning_sign_contact": True},
        "risk_check": {"taken": True, "answers": {**ELIGIBLE, **answers}},
    }


async def test_create_contact_returns_risk_group_and_can_be_read_back(client):
    res = await client.post("/contacts", json=contact_body())
    assert res.status_code == 201
    created = res.json()
    assert created["risk_group"] == "screening_pilot_eligible"
    assert created["risk_check"]["risk_group"] == "screening_pilot_eligible"

    got = await client.get(f"/contacts/{created['_id']}")
    assert got.status_code == 200
    assert got.json()["county"] == "Western Uusimaa"
    assert got.json()["promoted_patient_id"] is None


@pytest.mark.parametrize(
    ("answers", "county", "expected"),
    [
        ({"age": 49}, "Western Uusimaa", "not_eligible"),
        ({"age": 50}, "Western Uusimaa", "screening_pilot_eligible"),
        ({"age": 74}, "Western Uusimaa", "screening_pilot_eligible"),
        ({"age": 75}, "Western Uusimaa", "not_eligible"),
        ({"cigarettes_per_day": 15, "years_smoked": 26}, "Pirkanmaa", "not_eligible"),
        ({"cigarettes_per_day": 16, "years_smoked": 26}, "Pirkanmaa", "screening_pilot_eligible"),
        ({"cigarettes_per_day": 16, "years_smoked": 25}, "Pirkanmaa", "not_eligible"),
        ({"cigarettes_per_day": 10, "years_smoked": 31}, "Ostrobothnia", "not_eligible"),
        ({"cigarettes_per_day": 11, "years_smoked": 30}, "Ostrobothnia", "not_eligible"),
        ({"cigarettes_per_day": 11, "years_smoked": 31}, "Ostrobothnia", "screening_pilot_eligible"),
        ({"smoking_status": "former", "cigarettes_per_day": None, "years_smoked": None}, "Western Uusimaa", "not_eligible"),
        ({"smoking_status": "never", "cigarettes_per_day": None, "years_smoked": None}, "Western Uusimaa", "never_smoked"),
        ({}, "Kymenlaakso", "not_eligible"),
        ({}, "North Ostrobothnia", "screening_pilot_eligible"),
        ({}, "Southwest Finland", "screening_pilot_eligible"),
    ],
)
async def test_risk_group_follows_the_pilot_criteria(client, answers, county, expected):
    res = await client.post("/contacts", json=contact_body(county=county, **answers))
    assert res.status_code == 201
    assert res.json()["risk_group"] == expected
