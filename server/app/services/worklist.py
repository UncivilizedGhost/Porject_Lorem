"""Worklist merge and Alert bookkeeping. Owner: person 3.

Merges alerts + fired unconfirmed escalation_steps + callback-pending contacts into rows of
one shape, bands 1..4 (red Alerts, call-backs, overdue Confirmations, yellow/green Alerts),
oldest first within a band. Closed and handled rows drop off. delivery_status from sms_sent
events and step state (digital vs paper read-status rule, plan 4.2). Workload line derived
from today's Alerts.

Also: create-or-append an Alert for a graded Check-in / Symptom Report / warning-sign tap
(same subject + symptom while open → append to trigger_event_ids), acknowledge, actions.
"""

from __future__ import annotations

from typing import Any

from app import db
from app.fixtures.seed import COORDINATOR_ID
from app.models import ActionTaken, Alert
from app.rules.catalogue import WARNING_SIGNS
from app.services.demo_clock import current_day, now_iso

_ORDER = {"green": 0, "yellow": 1, "red": 2}
TARGET_DAYS = 42
LABELS = {"red": "Call now", "yellow": "Nurse review", "green": "Routine"}
WARNING_LABELS = {w["id"]: w["label"] for w in WARNING_SIGNS}

RUNG_REASON = {
    "message_sms": "Appointment text message sent, no confirmation yet",
    "auto_call": "Automated call placed, no confirmation",
    "nurse_call": "No confirmation after 3 days, nurse call due",
    "trusted_person": "No confirmation after 5 days, contact the Trusted Person",
    "flag_health_centre": "No confirmation after 7 days, flag to the health centre",
}


# ---------------------------------------------------------------- alert bookkeeping


async def raise_alert(
    *,
    subject_type: str,
    subject_id: str,
    level: str,
    source: str,
    symptom: str | None,
    reason: str,
    event_id: str,
    actor: str = "self",
    trusted_person_name: str | None = None,
    advice_shown: str | None = None,
) -> str:
    """Create an Alert, or append to the open one for the same subject and symptom."""
    open_alerts = await db.find(
        "alerts", {"subject_id": subject_id, "symptom": symptom, "closed_at": None}
    )
    if open_alerts:
        alert = open_alerts[0]
        patch: dict[str, Any] = {"trigger_event_ids": [*alert["trigger_event_ids"], event_id]}
        if _ORDER[level] > _ORDER[alert["level"]]:
            patch.update(level=level, reason=reason, advice_shown=advice_shown)
        await db.update("alerts", alert["_id"], patch)
        return alert["_id"]
    doc = Alert(
        subject_type=subject_type,
        subject_id=subject_id,
        level=level,
        source=source,
        symptom=symptom,
        reason=reason,
        trigger_event_ids=[event_id],
        actor=actor,
        trusted_person_name=trusted_person_name,
        advice_shown=advice_shown,
        demo_day=await current_day(),
    )
    return await db.insert("alerts", doc.model_dump(mode="json"))


async def acknowledge(alert_id: str, coordinator_id: str) -> dict[str, Any] | None:
    alert = await db.get("alerts", alert_id)
    if alert is None:
        return None
    if alert.get("acknowledged_at"):
        return alert
    return await db.update(
        "alerts", alert_id, {"acknowledged_by": coordinator_id, "acknowledged_at": now_iso()}
    )


async def record_action(
    alert_id: str, action: str, note: str | None, coordinator_id: str | None
) -> dict[str, Any] | None:
    alert = await db.get("alerts", alert_id)
    if alert is None:
        return None
    entry = ActionTaken(action=action, by=coordinator_id or COORDINATOR_ID, at=now_iso(), note=note)
    await db.append("alerts", alert_id, "actions_taken", entry.model_dump(mode="json"))
    if action == "mark_done" and not alert.get("closed_at"):
        await db.update("alerts", alert_id, {"closed_at": now_iso()})
    return await db.get("alerts", alert_id)


async def close_callback(contact_id: str, status: str) -> dict[str, Any] | None:
    contact = await db.get("contacts", contact_id)
    if contact is None or not contact.get("callback"):
        return None
    return await db.update("contacts", contact_id, {"callback": {**contact["callback"], "status": status}})


async def mark_step_handled(step_id: str, outcome: str | None) -> dict[str, Any] | None:
    """Every fired, unconfirmed rung of that ladder is closed; a later rung firing reopens the row."""
    step = await db.get("escalation_steps", step_id)
    if step is None:
        return None
    for s in await db.find("escalation_steps", {"patient_id": step["patient_id"]}):
        if s.get("fired_at") and not s.get("confirmed_at") and not s.get("handled_at"):
            await db.update("escalation_steps", s["_id"], {"handled_at": now_iso(), "handled_outcome": outcome})
    return await db.get("escalation_steps", step_id)


async def reopen_alert(alert_id: str) -> dict[str, Any] | None:
    """Undo 'Mark done': clear closed_at so the Alert returns to the open Worklist."""
    alert = await db.get("alerts", alert_id)
    if alert is None:
        return None
    if not alert.get("closed_at"):
        return alert
    return await db.update("alerts", alert_id, {"closed_at": None})


async def reopen_step(step_id: str) -> dict[str, Any] | None:
    """Undo 'Mark handled': clear handled_at so the Escalation Step row returns."""
    step = await db.get("escalation_steps", step_id)
    if step is None:
        return None
    return await db.update("escalation_steps", step_id, {"handled_at": None, "handled_outcome": None})


async def escalate_now(patient_id: str) -> dict[str, Any] | None:
    """Demo shim for 'Escalate': put the patient's Confirmation ladder back on the Worklist.

    Fires the next open rung; if every rung was confirmed or handled, reopens the first rung.
    """
    if await db.get("patients", patient_id) is None:
        return None
    steps = sorted(
        await db.find("escalation_steps", {"patient_id": patient_id}),
        key=lambda s: s["step_index"],
    )
    if not steps:
        return None
    today = await current_day()
    pending = next((s for s in steps if not s.get("confirmed_at") and not s.get("handled_at")), None)
    if pending is not None:
        return await db.update(
            "escalation_steps",
            pending["_id"],
            {"fired_at": now_iso(), "due_demo_day": today, "handled_at": None, "handled_outcome": None},
        )
    first = steps[0]
    return await db.update(
        "escalation_steps",
        first["_id"],
        {
            "fired_at": now_iso(),
            "due_demo_day": today,
            "confirmed_at": None,
            "confirmed_by": None,
            "handled_at": None,
            "handled_outcome": None,
        },
    )


# ---------------------------------------------------------------- the merge


def _person(subject_type: str, doc: dict[str, Any] | None, subject_id: str) -> dict[str, Any]:
    doc = doc or {}
    return {
        "subject_type": subject_type,
        "subject_id": subject_id,
        "display_name": doc.get("display_name") or ("Patient" if subject_type == "patient" else "Contact"),
        "county": doc.get("county", ""),
        "phone": doc.get("phone"),
    }


def _clock(patient: dict[str, Any] | None, today: int) -> dict[str, Any] | None:
    if patient is None:
        return None
    started = patient["pathway_clock"]["started_demo_day"]
    return {
        "day": today - started,
        "target_days": TARGET_DAYS,
        "next_deadline": f"Day {TARGET_DAYS} (6-week target)",
    }


def _sms_status(events: list[dict[str, Any]]) -> list[str]:
    seen: list[str] = []
    for e in events:
        p = e.get("payload", {})
        answered = p.get("status") in ("confirmed", "replied", "answered")
        if p.get("channel") == "auto_call":
            text = "Automated call answered" if answered else "Automated call placed, no answer"
        else:
            text = "Text message confirmed" if answered else "Text message sent"
        if text not in seen:
            seen.append(text)
    return seen


def _step_status(steps: list[dict[str, Any]], patient: dict[str, Any]) -> list[str]:
    out: list[str] = []
    if patient.get("recipient_type", "digital") == "digital":
        first = next((s for s in steps if s["step_index"] == 0), None)
        if first and first.get("fired_at"):
            out.append("Suomi.fi Messages opened" if first.get("confirmed_at") else "Suomi.fi Messages not opened")
    if any(s["rung"] == "trusted_person" and s.get("confirmed_by") == "trusted_person" for s in steps):
        out.append("Trusted Person reached")
    return out


async def _delivery_status(subject_type: str, subject_id: str, patient: dict[str, Any] | None) -> list[str]:
    events = await db.find("events", {"subject_id": subject_id, "type": "sms_sent"})
    status = _sms_status(events)
    if patient:
        steps = await db.find("escalation_steps", {"patient_id": subject_id})
        status += _step_status(steps, patient)
    return status


def _row(**kw: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "level": None,
        "delivery_status": [],
        "pathway_clock": None,
        "reported_by": None,
        "waiting_working_days": None,
        "acknowledged": False,
        "label": None,
        "detail_ref": None,
    }
    return {**base, **kw}


async def _alert_rows(today: int) -> list[dict[str, Any]]:
    out = []
    for a in await db.find("alerts", {"closed_at": None}):
        table = "patients" if a["subject_type"] == "patient" else "contacts"
        doc = await db.get(table, a["subject_id"])
        patient = doc if a["subject_type"] == "patient" else None
        red = a["level"] == "red"
        actions = ["call", "book_appointment"]
        if red and not a.get("acknowledged_at"):
            actions.append("acknowledge")
        if a["subject_type"] == "patient":
            actions.append("escalate")
        actions += ["assign_to_me", "record_action", "mark_done"]
        if a["source"] == "symptom_report":
            actions.append("open_card")
        reporter = (
            {"actor": "trusted_person", "name": a.get("trusted_person_name") or "Trusted Person"}
            if a["actor"] == "trusted_person"
            else None
        )
        out.append(
            _row(
                row_id=f"alert:{a['_id']}",
                kind="alert",
                band=1 if red else 4,
                level=a["level"],
                label=LABELS[a["level"]],
                person=_person(a["subject_type"], doc, a["subject_id"]),
                reason=a["reason"],
                delivery_status=await _delivery_status(a["subject_type"], a["subject_id"], patient),
                pathway_clock=_clock(patient, today),
                reported_by=reporter,
                created_at=a["created_at"],
                waiting_working_days=float(today - a.get("demo_day", today)),
                acknowledged=bool(a.get("acknowledged_at")),
                actions=actions,
                detail_ref=a["_id"],
            )
        )
    return out


async def _callback_rows(today: int) -> list[dict[str, Any]]:
    out = []
    for c in await db.find("contacts", {"callback": {"status": "pending"}}):
        cb = c.get("callback")
        if not cb or cb["status"] != "pending" or c.get("promoted_patient_id"):
            continue
        sign = (c.get("warning_sign_tap") or {}).get("symptom", "")
        out.append(
            _row(
                row_id=f"callback:{c['_id']}",
                kind="callback",
                band=2,
                level="yellow",
                label="Call-back due",
                person=_person("contact", c, c["_id"]),
                reason=f"{WARNING_LABELS.get(sign, sign)}, call-back due",
                delivery_status=await _delivery_status("contact", c["_id"], None),
                created_at=cb["at"],
                waiting_working_days=float(today - cb.get("demo_day", today)),
                actions=["call", "book_appointment", "book_health_station_xray", "flag_referral", "mark_handled"],
                detail_ref=c["_id"],
            )
        )
    return out


async def _escalation_rows(today: int) -> list[dict[str, Any]]:
    out = []
    for p in await db.find("patients"):
        steps = await db.find("escalation_steps", {"patient_id": p["_id"]})
        live = [s for s in steps if s.get("fired_at") and not s.get("confirmed_at") and not s.get("handled_at")]
        if not live:
            continue
        step = max(live, key=lambda s: s["step_index"])
        out.append(
            _row(
                row_id=f"escalation:{step['_id']}",
                kind="escalation",
                band=3,
                person=_person("patient", p, p["_id"]),
                reason=RUNG_REASON[step["rung"]],
                delivery_status=await _delivery_status("patient", p["_id"], p),
                pathway_clock=_clock(p, today),
                created_at=step["fired_at"],
                waiting_working_days=float(today - step["due_demo_day"]),
                actions=["call", "rebook", "mark_handled", "hand_to_trusted_person"],
                detail_ref=step["_id"],
            )
        )
    return out


async def workload(today: int) -> dict[str, Any]:
    alerts = await db.find("alerts")
    todays = [a for a in alerts if a.get("demo_day") == today]
    closed = [a for a in alerts if a.get("closed_at")]
    false_alarms = [
        a
        for a in closed
        if any(x["action"] == "mark_done" and (x.get("note") or "").lower() == "false alarm" for x in a["actions_taken"])
    ]
    share = round(len(false_alarms) / len(closed), 2) if closed else 0.0
    return {"alerts_today": len(todays), "false_alarm_share": share}


async def _done_rows() -> list[dict[str, Any]]:
    """Recently closed Alerts and handled Escalation Steps, newest first."""
    out = []
    for a in await db.find("alerts"):
        if not a.get("closed_at"):
            continue
        table = "patients" if a["subject_type"] == "patient" else "contacts"
        doc = await db.get(table, a["subject_id"])
        actions = a.get("actions_taken") or []
        note = (actions[-1].get("note") or "").strip() if actions else ""
        out.append(
            {
                "row_id": f"done:alert:{a['_id']}",
                "kind": "alert",
                "level": a.get("level"),
                "label": LABELS.get(a.get("level")),
                "person": _person(a["subject_type"], doc, a["subject_id"]),
                "reason": a.get("reason", ""),
                "done_at": a["closed_at"],
                "outcome": note or "Marked done",
                "detail_ref": a["_id"],
            }
        )
    for p in await db.find("patients"):
        for s in await db.find("escalation_steps", {"patient_id": p["_id"]}):
            if not s.get("handled_at"):
                continue
            out.append(
                {
                    "row_id": f"done:escalation:{s['_id']}",
                    "kind": "escalation",
                    "level": None,
                    "label": "Handled",
                    "person": _person("patient", p, p["_id"]),
                    "reason": RUNG_REASON[s["rung"]],
                    "done_at": s["handled_at"],
                    "outcome": (s.get("handled_outcome") or "handled").replace("_", " "),
                    "detail_ref": s["_id"],
                }
            )
    out.sort(key=lambda r: r["done_at"], reverse=True)
    return out


async def build(coordinator_id: str | None = None) -> dict[str, Any]:
    today = await current_day()
    rows = [*await _alert_rows(today), *await _callback_rows(today), *await _escalation_rows(today)]
    rows.sort(key=lambda r: (r["band"], r["created_at"]))
    done = await _done_rows()
    total = len(rows) + len(done)
    counts = await workload(today)
    counts.update(
        open_count=len(rows),
        done_count=len(done),
        pct_done=round(100 * len(done) / total) if total else 0,
    )
    return {"rows": rows, "done": done[:20], "workload": counts, "current_demo_day": today}
