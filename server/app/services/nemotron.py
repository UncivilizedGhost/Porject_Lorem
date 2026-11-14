"""Shared Nemotron client (Learn rephrasing + dashboard summary). Owned by whoever lands first
(person 1 or 4); the other reuses it. Endpoint/model from env, key from
`.secrets/verda_inference_key` (config.nemotron_key). Never reaches the frontend.
"""

from __future__ import annotations

from app import config


async def complete(system: str, user: str, *, timeout_s: float | None = None) -> str:
    """One chat completion. Raises on HTTP error or timeout; callers fall back."""
    timeout_s = timeout_s or config.NEMOTRON_TIMEOUT_S
    raise NotImplementedError
