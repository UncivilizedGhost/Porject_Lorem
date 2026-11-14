"""Pydantic models for the data contract (umbrella spec). Owner: person 3.

These are the real schema: the JSONB column does not reject a malformed document, so writes
are validated here. Timestamps are ISO strings (UTC), same as what `db` returns.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

Grade = Literal["red", "yellow", "green"]
Actor = Literal["self", "trusted_person"]
InputMode = Literal["touch", "voice"]
Advice = Literal["call_now", "nurse_review", "self_care"]


class TrustedPerson(BaseModel):
    name: str
    relationship: str = ""
    contact_method: str = ""
    consented_at: str | None = None


class Accessibility(BaseModel):
    read_aloud: bool = False
    voice_mode: bool = False
    text_size: Literal["m", "l", "xl"] = "m"
    high_contrast: bool = False


class Callback(BaseModel):
    status: Literal["pending", "booked", "handled"]
    at: str
    demo_day: int = 0


class Contact(BaseModel):
    county: str
    language: str = "fi"
    consent: dict[str, Any] = Field(default_factory=dict)
    risk_check: dict[str, Any] = Field(default_factory=lambda: {"taken": False, "risk_group": None, "at": None})
    warning_sign_tap: dict[str, Any] | None = None
    trusted_people: list[TrustedPerson] = Field(default_factory=list)
    accessibility: Accessibility = Field(default_factory=Accessibility)
    promoted_patient_id: str | None = None
    callback: Callback | None = None
    display_name: str | None = None
    phone: str | None = None
    recipient_type: Literal["digital", "paper"] = "digital"


class Referral(BaseModel):
    flagged_by: str
    source: str
    at: str


class PathwayClock(BaseModel):
    started_demo_day: int
    current_demo_day: int


class Patient(BaseModel):
    contact_id: str
    county: str
    demographics: dict[str, Any] = Field(default_factory=dict)
    coordinator_id: str
    referral: Referral
    phase: Literal["suspected_cancer", "treatment"]
    pathway_clock: PathwayClock
    trusted_people: list[TrustedPerson] = Field(default_factory=list)
    accessibility: Accessibility = Field(default_factory=Accessibility)
    display_name: str | None = None
    phone: str | None = None
    recipient_type: Literal["digital", "paper"] = "digital"


class Event(BaseModel):
    subject_type: Literal["contact", "patient"]
    subject_id: str
    type: Literal[
        "warning_sign_tap", "confirmation", "checkin", "symptom_report", "medication_log", "sms_sent", "fhir_sync"
    ]
    payload: dict[str, Any] = Field(default_factory=dict)
    actor: Literal["self", "trusted_person", "coordinator"] = "self"
    input: InputMode = "touch"
    demo_day: int


class ActionTaken(BaseModel):
    action: str
    by: str
    at: str
    note: str | None = None


class Alert(BaseModel):
    subject_type: Literal["contact", "patient"]
    subject_id: str
    level: Grade
    source: Literal["checkin", "symptom_report", "warning_sign_tap", "medication_log"]
    symptom: str | None = None
    reason: str
    trigger_event_ids: list[str] = Field(default_factory=list)
    actor: Actor = "self"
    trusted_person_name: str | None = None
    advice_shown: Advice | None = None
    acknowledged_by: str | None = None
    acknowledged_at: str | None = None
    actions_taken: list[ActionTaken] = Field(default_factory=list)
    closed_at: str | None = None
    demo_day: int = 0


class Appointment(BaseModel):
    subject_type: Literal["contact", "patient"]
    subject_id: str
    clinician_id: str
    type: str
    start: str
    location: str


class Coordinator(BaseModel):
    name: str
    county: str
