"""Learn pipeline (plan section 4.6). Owner: person 4.

ask(question, language) → { kind: safety | no_source | answer, text, sources }
1. red_flags.contains(question) → fixed safety message
2. retrieval.search(question, language) empty → "ask your nurse" + Nurse Aino's number
3. pregenerated answer for this question + passages (suggested questions) → served as is
4. nemotron rephrases only the retrieved passages; failure → best passage verbatim with source
"""

from __future__ import annotations

import asyncio
import logging

from app import config
from app.services import nemotron
from app.services.learn import pregenerated, red_flags, retrieval

log = logging.getLogger(__name__)

LANGUAGES = ("fi", "sv", "en")

NO_SOURCE: dict[str, str] = {
    "fi": "Minulla ei ole tarkistettua vastausta tähän. Kysy hoitajalta: Hoitaja Aino, arkisin 8–16.",
    "sv": "Jag har inget granskat svar på det. Fråga din sjuksköterska: Sjuksköterska Aino, vardagar 8–16.",
    "en": "I don't have a reviewed answer for that. Ask your nurse: Nurse Aino, weekdays 8–16.",
}

LANGUAGE_NAMES = {"fi": "plain Finnish (selkosuomi)", "sv": "plain Swedish", "en": "plain English"}

SYSTEM_PROMPT = (
    "You rephrase health information for a patient. Use ONLY the passages provided by the user; "
    "never add facts from your own knowledge. Write short, plain sentences in {language}. "
    "Do not diagnose, do not give a prognosis, and do not give any medicine dosing. "
    "If the passages do not answer the question, say so briefly."
)


def _source(passage: dict) -> dict:
    return {"label": passage["source_label"], "url": passage["url"], "passage_id": passage["id"]}


def build_prompt(question: str, language: str, passages: list[dict]) -> tuple[str, str]:
    """(system, user) for the model; shared with scripts/pregenerate_answers.py."""
    user = "Passages:\n" + "\n\n".join(f"[{p['title']}]\n{p['text']}" for p in passages)
    user += f"\n\nQuestion: {question}"
    return SYSTEM_PROMPT.format(language=LANGUAGE_NAMES[language]), user


async def ask(question: str, language: str) -> dict:
    language = language if language in LANGUAGES else "en"

    if red_flags.contains_red_flag(question, language):
        return {"kind": "safety", "text": red_flags.SAFETY_MESSAGE[language], "sources": []}

    passages = retrieval.search(question, language)
    if not passages:
        text = NO_SOURCE[language].format(phone=config.NURSE_PHONE)
        return {"kind": "no_source", "text": text, "sources": []}

    best = passages[0]
    sources = [_source(p) for p in passages]
    ready = pregenerated.lookup(question, language, [p["id"] for p in passages])
    if ready:
        return {"kind": "answer", "text": ready, "sources": sources}

    system, user = build_prompt(question, language, passages)
    try:
        text = await asyncio.wait_for(
            nemotron.complete(system, user, timeout_s=config.NEMOTRON_TIMEOUT_S),
            timeout=config.NEMOTRON_TIMEOUT_S,
        )
        text = text.strip()
        if not text:
            raise ValueError("empty model answer")
    except Exception as exc:  # noqa: BLE001 - any model failure degrades to the sourced passage
        log.warning("learn: model unavailable (%s); returning passage verbatim", type(exc).__name__)
        text, sources = best["text"], [_source(best)]
    return {"kind": "answer", "text": text, "sources": sources}
