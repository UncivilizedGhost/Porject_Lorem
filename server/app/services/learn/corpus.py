"""Loads fixtures/learn_corpus.json: passages { id, language, title, text, source_label, url }.
Allowed sources only (Syöpätalo, Pirkanmaa/OYS pathways, Käypä hoito patient versions,
kaikkisyovasta.fi, county instructions). Licences checked before reuse."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

CORPUS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "learn_corpus.json"


@lru_cache(maxsize=1)
def load() -> tuple[dict, ...]:
    return tuple(json.loads(CORPUS_PATH.read_text(encoding="utf-8")))


def passages(language: str) -> list[dict]:
    return [p for p in load() if p["language"] == language]
