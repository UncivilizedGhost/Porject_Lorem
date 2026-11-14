"""Simulated SMS / automated call / FHIR sync (ADR-0004). Owner: person 4.

These signatures are final from hour 1: person 3's promotion and advance-day code imports them.
Until implemented they are no-ops that write nothing.
"""

from __future__ import annotations

from typing import Any, Literal

Channel = Literal["sms", "auto_call", "suomi_fi"]


async def send_sms(
    to: str,
    text: str,
    subject_type: str,
    subject_id: str,
    purpose: str,
    *,
    channel: Channel = "sms",
) -> str | None:
    """Write an `sms_sent` event { to, text, purpose, channel, simulated: true, status: "sent" }.
    Returns the event id."""
    # TODO(person 4)
    return None


async def log_fhir_sync(subject_type: str, subject_id: str, resource_summary: dict[str, Any]) -> str | None:
    """Write a `fhir_sync` event with a minimal FHIR R4 Bundle (collection) holding one
    Observation or MedicationStatement, payload mock: true. Returns the event id."""
    # TODO(person 4)
    return None
