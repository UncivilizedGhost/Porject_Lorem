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

from app.services.learn.text import normalize

ANSWERS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "learn_answers.json"


@lru_cache(maxsize=1)
def load() -> list[dict]:
    if not ANSWERS_PATH.is_file():
        return []
    return json.loads(ANSWERS_PATH.read_text(encoding="utf-8"))


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
