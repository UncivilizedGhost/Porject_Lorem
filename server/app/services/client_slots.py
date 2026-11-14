"""Demo admission: at most `config.MAX_CLIENTS` browsers use the API at once.

Each browser sends a random `X-Client-Id` (made once, kept in localStorage). A slot is held while
the browser keeps calling and freed after `config.CLIENT_IDLE_S` seconds of silence. A request
without the header, or from one browser more than the limit, is refused. MAX_CLIENTS=0 turns admission off (local dev, tests).
"""

from __future__ import annotations

import time

from app import config

_last_seen: dict[str, float] = {}


def admit(client_id: str | None, now: float | None = None) -> bool:
    if config.MAX_CLIENTS <= 0:
        return True
    if not client_id:
        return False
    now = time.monotonic() if now is None else now
    for cid, seen in list(_last_seen.items()):
        if now - seen > config.CLIENT_IDLE_S:
            del _last_seen[cid]
    if client_id not in _last_seen and len(_last_seen) >= config.MAX_CLIENTS:
        return False
    _last_seen[client_id] = now
    return True


def active() -> int:
    return len(_last_seen)


def clear() -> None:
    _last_seen.clear()
