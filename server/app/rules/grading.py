"""The grading half of the rules module. Pure functions; see package docstring.

- any Safety Check item ticked → red, advice call_now, rule "Safety Check: <item>"
- per-symptom option → grade maps; fever depends on phase
  (treatment: ≥38.0 / <36.0 / unwell → red, 37.5–37.9 → yellow;
   not on treatment: >38.0 with unwell → red, 37.5–38.0 → yellow)
- "something else": severity + interference + new/worse → grade
- combine: worst wins; two or more yellows → red; rule is a readable string
- Check-in: same symptom rules + Red Flags (fever during treatment, breathlessness at rest,
  coughing up blood)
- warning sign: coughing up blood → red, anything else → yellow (call-back)
- Own Words never change a grade (accepted in the payload, never read)
"""

from __future__ import annotations

from typing import Any

from app.rules.catalogue import (
    _CHECKIN_DEFS,
    _OTHER_DEFS,
    _SYMPTOM_DEFS,
    SAFETY_CHECK_ITEMS,
)

_ORDER = {"green": 0, "yellow": 1, "red": 2}
_ADVICE = {"red": "call_now", "yellow": "nurse_review", "green": "self_care"}

# "scope.question.option" → grade. Built from the same defs the catalogue is stripped from.
OPTION_GRADES: dict[str, str] = {}
for _s in _SYMPTOM_DEFS:
    for _q in _s["questions"]:
        for _o in _q.get("options", []):
            OPTION_GRADES[f"{_s['id']}.{_q['id']}.{_o['id']}"] = _o["grade"]
for _q in _OTHER_DEFS:
    for _o in _q.get("options", []):
        OPTION_GRADES[f"other.{_q['id']}.{_o['id']}"] = _o["grade"]
for _q in _CHECKIN_DEFS:
    for _o in _q.get("options", []):
        OPTION_GRADES[f"checkin.{_q['id']}.{_o['id']}"] = _o["grade"]

_QUESTIONS = {s["id"]: {q["id"]: q for q in s["questions"]} for s in _SYMPTOM_DEFS}
_QUESTIONS["other"] = {q["id"]: q for q in _OTHER_DEFS}
_QUESTIONS["checkin"] = {q["id"]: q for q in _CHECKIN_DEFS}
_SAFETY_IDS = {i["id"] for i in SAFETY_CHECK_ITEMS}


def _worst(a: str, b: str) -> str:
    return a if _ORDER[a] >= _ORDER[b] else b


def _comma(t: float) -> str:
    return f"{t:.1f}".replace(".", ",")


def _option_label(scope: str, question: str, option: str) -> str:
    for o in _QUESTIONS[scope][question]["options"]:
        if o["id"] == option:
            return o["label"]
    raise ValueError(f"unknown option {option!r} for {scope}.{question}")


def _grade_choices(scope: str, answers: dict[str, Any], skip: set[str] | None = None) -> tuple[str, str]:
    """Worst grade over the answered choice questions of one scope, with the reason."""
    grade, why = "green", ""
    for qid, value in answers.items():
        if qid in (skip or set()):
            continue
        question = _QUESTIONS[scope].get(qid)
        if question is None:
            raise ValueError(f"unknown question {qid!r} for {scope}")
        if question["kind"] != "choice":
            continue
        gate = question.get("show_if")
        if gate and answers.get(gate["question"]) == gate["not"]:
            continue
        key = f"{scope}.{qid}.{value}"
        if key not in OPTION_GRADES:
            raise ValueError(f"unknown option {value!r} for {scope}.{qid}")
        g = OPTION_GRADES[key]
        if _ORDER[g] > _ORDER[grade]:
            grade, why = g, _option_label(scope, qid, value)
    return grade, why


def _grade_fever(temp: float | None, unwell: bool, phase: str) -> tuple[str, str]:
    on_treatment = phase == "treatment"
    where = "during treatment" if on_treatment else "before treatment"
    t = f"{_comma(temp)} °C" if temp is not None else None
    if on_treatment:
        if temp is not None and (temp >= 38.0 or temp < 36.0):
            return "red", f"Temperature {t} {where}"
        if unwell:
            return "red", f"Feeling generally unwell {where}"
        if temp is not None and temp >= 37.5:
            return "yellow", f"Temperature {t} {where}"
        return "green", ""
    if temp is not None and temp > 38.0 and unwell:
        return "red", f"Temperature {t} and feeling unwell"
    if temp is not None and temp >= 37.5:
        return "yellow", f"Temperature {t}"
    if unwell:
        return "yellow", "Feeling generally unwell"
    return "green", ""


def _combine(parts: dict[str, tuple[str, str]], safety: str | None = None) -> dict[str, Any]:
    """Worst wins; two or more yellows make red. `parts` is name → (grade, why)."""
    per = {name: grade for name, (grade, _) in parts.items()}
    if safety:
        return {"grade": "red", "rule": f"Safety Check: {safety}", "per_symptom_grades": per}
    yellows = [n for n, g in per.items() if g == "yellow"]
    reds = [n for n, g in per.items() if g == "red"]
    if reds:
        name = reds[0]
        grade, rule = "red", f"{name}: {parts[name][1]}"
    elif len(yellows) >= 2:
        grade, rule = "red", f"{len(yellows)} yellows ({', '.join(yellows)})"
    elif yellows:
        grade, rule = "yellow", f"{yellows[0]}: {parts[yellows[0]][1]}"
    else:
        grade, rule = "green", "All answers green"
    return {"grade": grade, "rule": rule, "per_symptom_grades": per}


def _number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def grade_symptom_report(payload: dict[str, Any], phase: str) -> dict[str, Any]:
    ticked = (payload.get("safety_check") or {}).get("ticked") or []
    for item in ticked:
        if item not in _SAFETY_IDS:
            raise ValueError(f"unknown Safety Check item {item!r}")
    # payload["own_words"] is deliberately never read.
    parts: dict[str, tuple[str, str]] = {}
    for entry in payload.get("symptoms") or []:
        symptom, answers = entry["symptom"], entry.get("answers") or {}
        if symptom not in _QUESTIONS or symptom == "checkin":
            raise ValueError(f"unknown symptom {symptom!r}")
        if symptom == "fever_unwell":
            temp = _number(answers.get("temperature"))
            parts[symptom] = _grade_fever(temp, answers.get("feeling") == "unwell", phase)
            if answers.get("feeling") not in (None, "well", "unwell"):
                raise ValueError("unknown option for fever_unwell.feeling")
        else:
            parts[symptom] = _grade_choices(symptom, answers)
    result = _combine(parts, safety=ticked[0].replace("_", " ") if ticked else None)
    if ticked:
        result["grade"] = "red"
    result["advice_shown"] = _ADVICE[result["grade"]]
    return result


def grade_checkin(answers: dict[str, Any], phase: str) -> dict[str, Any]:
    parts: dict[str, tuple[str, str]] = {}
    if "temperature" in answers or "feeling_unwell" in answers:
        parts["fever_unwell"] = _grade_fever(
            _number(answers.get("temperature")), answers.get("feeling_unwell") == "unwell", phase
        )
    for item, value in answers.items():
        if item in ("temperature", "feeling_unwell"):
            continue
        question = _QUESTIONS["checkin"].get(item)
        if question is None:
            raise ValueError(f"unknown check-in item {item!r}")
        key = f"checkin.{item}.{value}"
        if key not in OPTION_GRADES:
            raise ValueError(f"unknown option {value!r} for check-in item {item}")
        parts[item] = (OPTION_GRADES[key], _option_label("checkin", item, value))
    result = _combine(parts)
    result["advice_shown"] = _ADVICE[result["grade"]]
    return result


def grade_warning_sign(symptom: str) -> dict[str, Any]:
    if symptom == "coughing_up_blood":
        return {"grade": "red", "advice": "seek_care_today"}
    return {"grade": "yellow", "advice": "nurse_call_back"}
