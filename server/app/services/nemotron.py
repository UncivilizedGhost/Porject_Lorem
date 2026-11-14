"""Shared Nemotron client (Learn rephrasing + dashboard summary). Owned by whoever lands first
(person 1 or 4); the other reuses it. Endpoint/model from env, key from
`.secrets/verda_inference_key` (config.nemotron_key). Never reaches the frontend.
"""

from __future__ import annotations

import httpx

from app import config


async def complete(system: str, user: str, *, timeout_s: float | None = None) -> str:
    """One chat completion. Raises on HTTP error or timeout; callers fall back."""
    timeout_s = timeout_s or config.NEMOTRON_TIMEOUT_S
    key = config.nemotron_key()
    if not config.NEMOTRON_BASE_URL or not key:
        raise RuntimeError("Nemotron endpoint or key not configured")
    # OpenAI-compatible chat completions endpoint.
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        r = await client.post(
            f"{config.NEMOTRON_BASE_URL.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": config.NEMOTRON_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.2,
                "max_tokens": 400,
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
