"""Versioned grading rules (ADR-0006). Owner: person 3.

Pure module, no I/O. Both the companion's question screens (via `GET /rules`) and the
Check-in / Symptom Report / warning-sign endpoints read from here, so grading is never
hard-coded in a screen. Bump RULES_VERSION on any threshold change; it is stored on every
graded event. Thresholds are hackathon values (HUS, UKONS) pending clinical sign-off.

Public interface:
    catalogue()                                  → questions for the client, no grade maps
    grade_symptom_report(payload, phase)         → { grade, rule, advice_shown, per_symptom_grades }
    grade_checkin(answers, phase)                → { grade, rule, advice_shown }
    grade_warning_sign(symptom)                  → { grade, advice }
Own Words are accepted as an argument and ignored by grading.
"""

RULES_VERSION = "0.1"

from app.rules.catalogue import catalogue  # noqa: E402, F401
from app.rules.grading import (  # noqa: E402, F401
    grade_checkin,
    grade_symptom_report,
    grade_warning_sign,
)
