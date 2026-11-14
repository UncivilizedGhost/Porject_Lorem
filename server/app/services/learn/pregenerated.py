"""Pregenerated Learn answers: fixtures/learn_answers.json, written by
`python -m scripts.pregenerate_answers` against the real Nemotron endpoint.

The shared endpoint answers in about a minute under load, far past NEMOTRON_TIMEOUT_S, so the
suggested questions are answered ahead of time. An entry is served only when the question, the
language and the retrieved passage ids all match, so a corpus edit never serves a stale answer.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app import db
from app.services.learn.text import normalize

ANSWERS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "learn_answers.json"


_db_answers: list[dict] | None = None


@lru_cache(maxsize=1)
def _load_file() -> list[dict]:
    if not ANSWERS_PATH.is_file():
        return []
    return json.loads(ANSWERS_PATH.read_text(encoding="utf-8"))


def load() -> list[dict]:
    return _db_answers if _db_answers is not None else _load_file()


async def refresh() -> None:
    """Load the answers from the database; an empty table or a failed read keeps the file."""
    global _db_answers
    try:
        rows = await db.find("learn_answers")
    except Exception as exc:  # noqa: BLE001 - fall back to the file
        print(f"[learn] answers read failed, serving fixture file: {exc}")
        rows = []
    _db_answers = [{k: v for k, v in r.items() if k not in ("_id", "created_at")} for r in rows] or None


def lookup(question: str, language: str, passage_ids: list[str]) -> str | None:
    key = normalize(question)
    for entry in load():
        if (
            entry["language"] == language
            and normalize(entry["question"]) == key
            and entry["passage_ids"] == passage_ids
        ):
            return entry["text"]
    return None
