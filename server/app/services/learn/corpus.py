"""Loads fixtures/learn_corpus.json: passages { id, language, title, text, source_label, url }.

Only passages whose URL is on a domain listed in data/credible_sources.txt (one URL per line)
are ever served; a missing list serves nothing. Licences checked before reuse."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from app import config

CORPUS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "learn_corpus.json"


def _host(url: str) -> str:
    host = (urlparse(url.strip()).hostname or "").lower()
    return host.removeprefix("www.")


@lru_cache(maxsize=1)
def load_all() -> tuple[dict, ...]:
    return tuple(json.loads(CORPUS_PATH.read_text(encoding="utf-8")))


def credible_domains() -> set[str]:
    path = Path(config.CREDIBLE_SOURCES_PATH)
    if not path.is_file():
        return set()
    return {_host(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def is_credible(url: str, allowed: set[str]) -> bool:
    host = _host(url)
    return any(host == d or host.endswith("." + d) for d in allowed)


def passages(language: str) -> list[dict]:
    allowed = credible_domains()
    return [p for p in load_all() if p["language"] == language and is_credible(p["url"], allowed)]
