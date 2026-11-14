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


def risk_group(*, age: int, county: str, current_smoker: str | None = None,
               ex_smoker: str | None = None, cigarettes_per_day: int | None = None,
               years_smoked: int | None = None) -> str:
    # Never smoked: not a current smoker and not an ex-smoker.
    if current_smoker != "yes" and ex_smoker != "yes":
        return "never_smoked"
    # Former smokers are not eligible.
    if ex_smoker == "yes":
        return "not_eligible"
    # Current smoker: apply pilot criteria.
    if not 50 <= age <= 74 or county not in PILOT_COUNTIES:
        return "not_eligible"
    cigs, years = cigarettes_per_day or 0, years_smoked or 0
    if (cigs > 15 and years > 25) or (cigs > 10 and years > 30):
        return "screening_pilot_eligible"
    return "not_eligible"
