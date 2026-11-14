"""Risk-group computation for `POST /contacts`. Owner: person 2.

National lung cancer screening pilot criteria (confirm against the pilot's sign-up page):
age 50–74; smokes daily now; >15 cigarettes/day for >25 years or >10/day for >30 years;
lives in Uusimaa (incl. Western Uusimaa), Pirkanmaa, Ostrobothnia, North Ostrobothnia or
Southwest Finland. → screening_pilot_eligible | not_eligible | never_smoked.
Former smokers are not eligible (the demo persona goes the warning-sign route).
"""

from __future__ import annotations

# Wellbeing services counties inside the pilot regions (Uusimaa incl. Western Uusimaa,
# Pirkanmaa, Ostrobothnia, North Ostrobothnia, Southwest Finland).
PILOT_COUNTIES = {
    "Western Uusimaa",
    "Vantaa-Kerava",
    "Central Uusimaa",
    "Eastern Uusimaa",
    "Helsinki",
    "Pirkanmaa",
    "Ostrobothnia",
    "North Ostrobothnia",
    "Southwest Finland",
}


def risk_group(*, age: int, county: str, smoking_status: str, cigarettes_per_day: int | None,
               years_smoked: int | None) -> str:
    if smoking_status == "never":
        return "never_smoked"
    if smoking_status != "daily" or not 50 <= age <= 74 or county not in PILOT_COUNTIES:
        return "not_eligible"
    cigs, years = cigarettes_per_day or 0, years_smoked or 0
    if (cigs > 15 and years > 25) or (cigs > 10 and years > 30):
        return "screening_pilot_eligible"
    return "not_eligible"
