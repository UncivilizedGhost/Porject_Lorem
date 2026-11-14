"""The questions half of the rules module.

Safety Check items (7, with the treatment-phase variant of item 4), the symptoms and their
ordered guided questions (choice | number, option ids + labels, units), the "something else"
PRO-CTCAE triple, the ~10 Check-in items and the warning-sign list.
Research: docs/research/on-demand-symptom-reporting.md §3.2–3.5.

`_SYMPTOM_DEFS` and `_CHECKIN_DEFS` carry a `grade` on every option. `catalogue()` strips them:
no grade map ever leaves the server. The grading half (`grading.py`) reads the same defs, so
a question and its grade can never drift apart.
"""

from __future__ import annotations

from typing import Any

Q = dict[str, Any]


def _opt(id: str, label: str, grade: str) -> Q:
    return {"id": id, "label": label, "grade": grade}


def _choice(id: str, prompt: str, options: list[Q], **extra: Any) -> Q:
    return {"id": id, "prompt": prompt, "kind": "choice", "options": options, **extra}


def _number(id: str, prompt: str, unit: str) -> Q:
    return {"id": id, "prompt": prompt, "kind": "number", "unit": unit}


YES_NO_NEW = [_opt("no", "No", "green"), _opt("yes", "Yes", "yellow")]
_ONLY_IF_NEW = {"question": "new_or_worse", "not": "no"}

SAFETY_CHECK_ITEMS: list[Q] = [
    {"id": "breathless_rest", "label": "I am very short of breath at rest, or struggling to breathe or speak"},
    {"id": "chest_pain", "label": "I have chest pain or chest tightness right now"},
    {"id": "bleeding", "label": "I am coughing up more than a few streaks of blood, or bleeding that won't stop"},
    {
        "id": "fever_after_treatment",
        "label": "My temperature is 38 °C or higher, or I have shaking chills, and I have had cancer medicine in the last 6 weeks",
        "phase_variants": {
            "suspected_cancer": "My temperature is above 38,0 °C and I feel unwell",
        },
    },
    {"id": "fainted_confused", "label": "I have fainted, or I am newly confused or unusually drowsy"},
    {
        "id": "legs_bladder",
        "label": "New weakness or numbness in my legs, or numbness around the buttocks or groin, or I have lost control of bladder or bowel",
    },
    {"id": "face_neck_swelling", "label": "New swelling of my face, neck or arm, together with breathlessness"},
]

_SYMPTOM_DEFS: list[Q] = [
    {
        "id": "breathlessness",
        "label": "Breathlessness",
        "questions": [
            _choice("new_or_worse", "Is this new or worse than usual?", [_opt("no", "No, same as usual", "green"), _opt("yes", "Yes, new or worse", "green")]),
            _choice(
                "when",
                "When are you short of breath?",
                [
                    _opt("stairs", "On stairs or when walking fast", "yellow"),
                    _opt("light_effort", "On light effort such as washing or dressing", "red"),
                    _opt("at_rest", "At rest", "red"),
                ],
                show_if=_ONLY_IF_NEW,
            ),
            _choice(
                "getting_worse",
                "Is it getting worse quickly?",
                [_opt("no", "No", "green"), _opt("yes", "Yes", "red")],
                show_if=_ONLY_IF_NEW,
            ),
        ],
    },
    {
        "id": "cough",
        "label": "Cough or coughing blood",
        "questions": [
            _choice(
                "blood",
                "Are you coughing up blood?",
                [
                    _opt("none", "No blood", "green"),
                    _opt("streaks", "Small streaks only", "yellow"),
                    _opt("more_than_streaks", "More than streaks, or clots", "red"),
                ],
            ),
            _choice("change", "Is the cough new or worse?", [_opt("no", "No, same as usual", "green"), _opt("yes", "Yes, new or worse", "yellow")]),
            _choice("fever_unwell", "Do you have a fever or feel generally unwell?", [_opt("no", "No", "green"), _opt("yes", "Yes", "red")]),
        ],
    },
    {
        "id": "pain",
        "label": "Pain",
        "questions": [
            _choice(
                "severity",
                "How bad is the pain?",
                [
                    _opt("mild", "Mild, my usual medicine controls it", "green"),
                    _opt("moderate", "Moderate, it affects daily activities", "yellow"),
                    _opt("severe", "Severe or disabling", "red"),
                ],
            ),
            _choice(
                "back_and_legs",
                "New back pain together with weak or numb legs?",
                [_opt("no", "No", "green"), _opt("yes", "Yes", "red")],
            ),
        ],
    },
    {
        "id": "fever_unwell",
        "label": "Fever or feeling unwell",
        "questions": [
            _number("temperature", "What is your temperature?", "°C"),
            _choice(
                "feeling",
                "Do you feel generally unwell?",
                [_opt("well", "No, otherwise well", "green"), _opt("unwell", "Yes, unwell", "red")],
            ),
        ],
    },
    {
        "id": "tired_appetite",
        "label": "Tiredness and appetite",
        "questions": [
            _choice(
                "activity",
                "How much does tiredness stop you?",
                [
                    _opt("managing", "I manage light activities", "green"),
                    _opt("cant_usual", "I can look after myself but not do usual activities", "yellow"),
                    _opt("in_bed", "In bed or a chair more than half the day", "red"),
                ],
            ),
            _choice(
                "eating",
                "Are you eating and drinking?",
                [
                    _opt("normal", "As usual", "green"),
                    _opt("less", "Noticeably less", "yellow"),
                    _opt("hardly", "Hardly anything, little urine", "red"),
                ],
            ),
        ],
    },
]

# "Something else": PRO-CTCAE severity + interference + new/worse (research §3.5).
_OTHER_DEFS: list[Q] = [
    _choice(
        "severity",
        "How bad is it at its worst?",
        [
            _opt("none", "None", "green"),
            _opt("mild", "Mild", "green"),
            _opt("moderate", "Moderate", "yellow"),
            _opt("severe", "Severe", "red"),
            _opt("very_severe", "Very severe", "red"),
        ],
    ),
    _choice(
        "interference",
        "How much does it stop your usual activities?",
        [
            _opt("not_at_all", "Not at all", "green"),
            _opt("a_little", "A little bit", "green"),
            _opt("somewhat", "Somewhat", "yellow"),
            _opt("quite_a_bit", "Quite a bit", "yellow"),
            _opt("very_much", "Very much", "red"),
        ],
    ),
    _choice("new_or_worse", "Is it new or getting worse?", YES_NO_NEW),
]

_SCALE = [_opt("none", "None", "green"), _opt("mild", "Mild", "green")]

_CHECKIN_DEFS: list[Q] = [
    _number("temperature", "What is your temperature today?", "°C"),
    _choice(
        "breathlessness",
        "Breathlessness",
        [
            _opt("none", "None", "green"),
            _opt("stairs", "On stairs or fast walking", "yellow"),
            _opt("light_effort", "On light effort", "yellow"),
            _opt("at_rest", "At rest", "red"),
        ],
    ),
    _choice(
        "cough",
        "Cough",
        [*_SCALE, _opt("moderate", "Moderate", "yellow"), _opt("severe", "Severe", "yellow")],
    ),
    _choice(
        "coughing_blood",
        "Coughing up blood",
        [
            _opt("none", "None", "green"),
            _opt("streaks", "Small streaks", "yellow"),
            _opt("more_than_streaks", "More than streaks", "red"),
        ],
    ),
    _choice("pain", "Pain", [*_SCALE, _opt("moderate", "Moderate", "yellow"), _opt("severe", "Severe", "red")]),
    _choice("fatigue", "Tiredness", [*_SCALE, _opt("moderate", "Moderate", "yellow"), _opt("severe", "Severe", "red")]),
    _choice("nausea", "Nausea", [*_SCALE, _opt("moderate", "Moderate", "yellow"), _opt("severe", "Severe", "yellow")]),
    _choice(
        "appetite",
        "Appetite",
        [_opt("normal", "As usual", "green"), _opt("less", "Eating less", "yellow"), _opt("hardly", "Hardly eating", "red")],
    ),
    _choice("diarrhoea", "Diarrhoea", [*_SCALE, _opt("moderate", "Moderate", "yellow"), _opt("severe", "Severe", "red")]),
    _choice(
        "feeling_unwell",
        "Do you feel generally unwell?",
        [_opt("well", "No", "green"), _opt("unwell", "Yes", "red")],
    ),
]

WARNING_SIGNS: list[Q] = [
    {"id": "coughing_up_blood", "label": "Coughing up blood"},
    {"id": "cough_over_3_weeks", "label": "A cough that has lasted more than 3 weeks"},
    {"id": "hoarseness", "label": "Hoarse voice for more than 3 weeks"},
    {"id": "breathlessness", "label": "New breathlessness"},
    {"id": "chest_pain", "label": "Chest or shoulder pain that does not go away"},
    {"id": "weight_loss", "label": "Weight loss without trying"},
    {"id": "tiredness", "label": "Unusual tiredness that does not pass"},
]


def _strip(question: Q) -> Q:
    out = {k: v for k, v in question.items() if k != "options"}
    if "options" in question:
        out["options"] = [{"id": o["id"], "label": o["label"]} for o in question["options"]]
    return out


def catalogue() -> dict:
    """What `GET /rules` returns. Never includes grade maps."""
    from app.rules import RULES_VERSION

    return {
        "rules_version": RULES_VERSION,
        "safety_check_items": SAFETY_CHECK_ITEMS,
        "symptoms": [
            {"id": s["id"], "label": s["label"], "questions": [_strip(q) for q in s["questions"]]}
            for s in _SYMPTOM_DEFS
        ],
        "other_symptom_questions": [_strip(q) for q in _OTHER_DEFS],
        "checkin_items": [_strip(q) for q in _CHECKIN_DEFS],
        "warning_signs": WARNING_SIGNS,
    }


def all_option_ids() -> list[str]:
    """Every choice option in the public catalogue as `scope.question.option`; used to check
    that each one has a grade."""
    cat = catalogue()
    keys: list[str] = []
    for s in cat["symptoms"]:
        for q in s["questions"]:
            keys += [f"{s['id']}.{q['id']}.{o['id']}" for o in q.get("options", [])]
    for q in cat["other_symptom_questions"]:
        keys += [f"other.{q['id']}.{o['id']}" for o in q.get("options", [])]
    for q in cat["checkin_items"]:
        keys += [f"checkin.{q['id']}.{o['id']}" for o in q.get("options", [])]
    return keys
