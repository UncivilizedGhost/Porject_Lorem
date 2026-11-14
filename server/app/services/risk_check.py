"""Risk-group computation for `POST /contacts`. Owner: person 2.

National lung cancer screening pilot criteria (confirm against the pilot's sign-up page):
age 50–74; smokes daily now; >15 cigarettes/day for >25 years or >10/day for >30 years;
lives in Uusimaa (incl. Western Uusimaa), Pirkanmaa, Ostrobothnia, North Ostrobothnia or
Southwest Finland. → screening_pilot_eligible | not_eligible | never_smoked.
Former smokers are not eligible (the demo persona goes the warning-sign route).
"""

from __future__ import annotations


def risk_group(*, age: int, county: str, smoking_status: str, cigarettes_per_day: int | None,
               years_smoked: int | None) -> str:
    raise NotImplementedError
