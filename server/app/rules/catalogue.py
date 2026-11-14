"""The questions half of the rules module.

Safety Check items (7, with the treatment-phase variant of item 4), the symptoms and their
ordered guided questions (choice | number, option ids + labels, units), the "something else"
PRO-CTCAE triple, the ~10 Check-in items and the warning-sign list.
Research: docs/research/on-demand-symptom-reporting.md §3.2–3.5.
"""

from __future__ import annotations

SAFETY_CHECK_ITEMS: list[dict] = []  # TODO: 7 items { id, label, phase_variant? }
SYMPTOMS: list[dict] = []  # TODO: { id, label, questions: [{ id, prompt, kind, options|unit }] }
OTHER_SYMPTOM_QUESTIONS: list[dict] = []  # TODO: PRO-CTCAE severity + interference + new/worse
CHECKIN_ITEMS: list[dict] = []  # TODO: ~10 PRO-CTCAE items incl. temperature (number)
WARNING_SIGNS: list[dict] = []  # TODO: Pirkanmaa's signs, "coughing_up_blood" among them


def catalogue() -> dict:
    """What `GET /rules` returns. Never includes grade maps."""
    from app.rules import RULES_VERSION

    return {
        "rules_version": RULES_VERSION,
        "safety_check_items": SAFETY_CHECK_ITEMS,
        "symptoms": SYMPTOMS,
        "other_symptom_questions": OTHER_SYMPTOM_QUESTIONS,
        "checkin_items": CHECKIN_ITEMS,
        "warning_signs": WARNING_SIGNS,
    }
