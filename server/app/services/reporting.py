"""Grading endpoints' logic: Check-in, Symptom Report, warning-sign tap, medication log.
Owner: person 3. Each writes an event, grades through `app.rules`, then raises an Alert.

The server computes grade / rule / advice_shown / rules_version. Request models carry none of
them, so a client-sent value is dropped before it gets here.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app import db, rules
from app.services import messaging, worklist
from app.services.demo_clock import current_day, now_iso
from app.services.events import write_event

MEDICINES = {m["id"]: m for m in json.loads((Path(__file__).parents[1] / "fixtures" / "medicines.json").read_text("utf-8"))}
_ORDER = {"green": 0, "yellow": 1, "red": 2}

TAP_MESSAGE = {
    "red": "Seek care today: call 116 117 or go to the nearest emergency department. In an emergency call 112.",
    "yellow": "Thank you. A nurse will call you within 1–2 working days.",
}


class NotFound(Exception):
    pass


async def _patient(patient_id: str) -> dict[str, Any]:
    p = await db.get("patients", patient_id)
    if p is None:
        raise NotFound(patient_id)
    return p


async def submit_checkin(
    patient_id: str, answers: dict[str, Any], actor: str, trusted_person_name: str | None, input: str
) -> dict[str, Any]:
    patient = await _patient(patient_id)
    result = rules.grade_checkin(answers, patient["phase"])  # ValueError → 422 at the router
    event_id = await write_event(
        "patient",
        patient_id,
        "checkin",
        {
            "answers": answers,
            "grade": result["grade"],
            "rule": result["rule"],
            "rules_version": rules.RULES_VERSION,
            "advice_shown": result["advice_shown"],
        },
        actor=actor,
        input=input,
    )
    if result["grade"] in ("red", "yellow"):
        await worklist.raise_alert(
            subject_type="patient",
            subject_id=patient_id,
            level=result["grade"],
            source="checkin",
            symptom="checkin",
            reason=result["rule"],
            event_id=event_id,
            actor=actor,
            trusted_person_name=trusted_person_name,
            advice_shown=result["advice_shown"],
        )
    return {"grade": result["grade"], "advice_shown": result["advice_shown"]}


async def submit_symptom_report(
    patient_id: str,
    safety_ticked: list[str],
    symptoms: list[dict[str, Any]],
    own_words: dict[str, Any] | None,
    actor: str,
    trusted_person_name: str | None,
    input: str,
) -> dict[str, Any]:
    patient = await _patient(patient_id)
    if not safety_ticked and not symptoms:
        raise ValueError("a Symptom Report needs a Safety Check item or at least one symptom")
    payload = {"safety_check": {"ticked": safety_ticked}, "symptoms": symptoms, "own_words": own_words}
    result = rules.grade_symptom_report(payload, patient["phase"])
    graded = [
        {"symptom": s["symptom"], "answers": s.get("answers") or {}, "grade": result["per_symptom_grades"][s["symptom"]]}
        for s in symptoms
    ]
    event_id = await write_event(
        "patient",
        patient_id,
        "symptom_report",
        {
            "safety_check": {"ticked": safety_ticked},
            "symptoms": graded,
            "own_words": own_words,  # verbatim, never graded (ADR-0006)
            "grade": result["grade"],
            "rule": result["rule"],
            "rules_version": rules.RULES_VERSION,
            "advice_shown": result["advice_shown"],
        },
        actor=actor,
        input=input,
    )
    worst = max(graded, key=lambda s: _ORDER[s["grade"]])["symptom"] if graded else "safety_check"
    await worklist.raise_alert(
        subject_type="patient",
        subject_id=patient_id,
        level=result["grade"],
        source="symptom_report",
        symptom=worst,
        reason=result["rule"],
        event_id=event_id,
        actor=actor,
        trusted_person_name=trusted_person_name,
        advice_shown=result["advice_shown"],
    )
    return {"grade": result["grade"], "advice_shown": result["advice_shown"], "rule": result["rule"]}


async def tap_warning_sign(contact_id: str, symptom: str, input: str = "touch") -> dict[str, Any]:
    contact = await db.get("contacts", contact_id)
    if contact is None:
        raise NotFound(contact_id)
    if symptom not in worklist.WARNING_LABELS:
        raise ValueError(f"unknown warning sign {symptom!r}")
    result = rules.grade_warning_sign(symptom)
    now, day = now_iso(), await current_day()
    event_id = await write_event(
        "contact",
        contact_id,
        "warning_sign_tap",
        {"symptom": symptom, "grade": result["grade"], "rules_version": rules.RULES_VERSION},
        input=input,
    )
    patch: dict[str, Any] = {"warning_sign_tap": {"symptom": symptom, "at": now}}
    if result["grade"] == "red":
        await worklist.raise_alert(
            subject_type="contact",
            subject_id=contact_id,
            level="red",
            source="warning_sign_tap",
            symptom=symptom,
            reason=f"{worklist.WARNING_LABELS[symptom]}, warning-sign tap",
            event_id=event_id,
            advice_shown="call_now",
        )
    else:
        patch["callback"] = {"status": "pending", "at": now, "demo_day": day}
    await db.update("contacts", contact_id, patch)
    message = TAP_MESSAGE[result["grade"]]
    await messaging.send_sms(
        contact.get("phone") or "+358 40 000 0000", message, "contact", contact_id, "warning_sign_callback"
    )
    return {"grade": result["grade"], "advice": result["advice"], "message": message}


async def log_medication(
    patient_id: str, medicine_id: str, status: str, actor: str, input: str
) -> dict[str, Any]:
    await _patient(patient_id)
    event_id = await write_event(
        "patient", patient_id, "medication_log", {"medicine_id": medicine_id, "status": status}, actor=actor, input=input
    )
    # Kanta sync: the sim log's FHIR half would otherwise stay empty forever.
    medicine = MEDICINES.get(medicine_id, {})
    await messaging.log_fhir_sync(
        "patient",
        patient_id,
        {
            "resource_type": "MedicationStatement",
            "display": medicine.get("label", medicine_id),
            "status": "completed" if status == "taken" else "not-taken",
        },
    )
    raised = False
    if status == "skipped":
        history = [
            e
            for e in await db.find("events", {"subject_id": patient_id, "type": "medication_log"})
            if e["payload"].get("medicine_id") == medicine_id
        ]
        streak = 0
        for e in reversed(history):
            if e["payload"]["status"] != "skipped":
                break
            streak += 1
        if streak >= 2:
            label = MEDICINES.get(medicine_id, {}).get("label", medicine_id)
            await worklist.raise_alert(
                subject_type="patient",
                subject_id=patient_id,
                level="yellow",
                source="medication_log",
                symptom=f"missed:{medicine_id}",
                reason=f"{streak} missed doses: {label}",
                event_id=event_id,
                actor=actor,
                advice_shown="nurse_review",
            )
            raised = True
    return {"status": status, "alert_raised": raised}


async def alert_card(alert_id: str) -> dict[str, Any] | None:
    """The R7 card: the Alert, each triggering report with its answers in plain words, Own Words
    verbatim, rules_version and the advice the Patient saw."""
    alert = await db.get("alerts", alert_id)
    if alert is None:
        return None
    reports = []
    for event_id in alert["trigger_event_ids"]:
        e = await db.get("events", event_id)
        if e is None:
            continue
        p = e["payload"]
        reports.append(
            {
                "event_id": event_id,
                "type": e["type"],
                "created_at": e["created_at"],
                "actor": e["actor"],
                "input": e["input"],
                "grade": p.get("grade"),
                "rule": p.get("rule"),
                "rules_version": p.get("rules_version"),
                "advice_shown": p.get("advice_shown"),
                "safety_check": p.get("safety_check", {"ticked": []}),
                "symptoms": [
                    {**s, "answers_plain": rules.describe_answers(s["symptom"], s["answers"])}
                    for s in p.get("symptoms", [])
                ],
                "own_words": p.get("own_words"),
            }
        )
    table = "patients" if alert["subject_type"] == "patient" else "contacts"
    person = await db.get(table, alert["subject_id"]) or {}
    today = await current_day()
    return {
        **alert,
        "person": {"display_name": person.get("display_name"), "phone": person.get("phone")},
        "reports": reports,
        "waiting_working_days": float(today - alert.get("demo_day", today)),
        "promise_working_days": [1, 2],
    }
