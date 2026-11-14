"""Fixed red-flag word list in fi / sv / en, shared by Learn and (mirrored in the frontend)
Voice Mode. Triggers the safety message only; never sets or lowers a grade (ADR-0006)."""

from __future__ import annotations

RED_FLAG_WORDS: dict[str, list[str]] = {"fi": [], "sv": [], "en": []}  # TODO

SAFETY_MESSAGE: dict[str, str] = {"fi": "", "sv": "", "en": ""}  # TODO: 112, 116 117, 38 °C rule


def contains_red_flag(text: str, language: str) -> bool:
    raise NotImplementedError
