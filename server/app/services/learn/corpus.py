"""Loads fixtures/learn_corpus.json: passages { id, language, title, text, source_label, url }.

Only passages whose URL is on a domain listed in fixtures/credible_sources.txt (one URL per line)
are ever served; a missing list serves nothing. Licences checked before reuse."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from app import config, db

CORPUS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "learn_corpus.json"


def _host(url: str) -> str:
    host = (urlparse(url.strip()).hostname or "").lower()
    return host.removeprefix("www.")


# Filled by refresh() from the database; None means "serve the fixture files".
_db_passages: tuple[dict, ...] | None = None
_db_domains: set[str] | None = None


@lru_cache(maxsize=1)
def _load_file() -> tuple[dict, ...]:
    return tuple(json.loads(CORPUS_PATH.read_text(encoding="utf-8")))


def load_all() -> tuple[dict, ...]:
    return _db_passages if _db_passages is not None else _load_file()


async def refresh() -> None:
    """Load passages and credible sources from the database. An empty table or a failed read
    leaves the fixture files in service, so Learn never goes silently empty."""
    global _db_passages, _db_domains
    try:
        passages_ = tuple({k: v for k, v in r.items() if k not in ("_id", "created_at")} for r in await db.find("learn_passages"))
        domains = {r["domain"] for r in await db.find("credible_sources")}
    except Exception as exc:  # noqa: BLE001 - fall back to the files
        print(f"[learn] database read failed, serving fixture files: {exc}")
        passages_, domains = (), set()
    _db_passages = passages_ or None
    _db_domains = domains or None


def credible_domains() -> set[str]:
    if _db_domains is not None:
        return _db_domains
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
