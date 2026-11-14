"""Shared Nemotron client (Learn rephrasing + dashboard summary). Owned by whoever lands first
(person 1 or 4); the other reuses it. Endpoint/model from env, key from
`.secrets/verda_inference_key` (config.nemotron_key). Never reaches the frontend.
"""

from __future__ import annotations

import httpx

from app import config

# Tests inject an httpx.MockTransport here; None means a real network transport.
_transport: httpx.AsyncBaseTransport | None = None


async def complete(system: str, user: str, *, timeout_s: float | None = None) -> str:
    """One chat completion. Raises on HTTP error or timeout; callers fall back."""
    timeout_s = timeout_s or config.NEMOTRON_TIMEOUT_S
    if not config.NEMOTRON_BASE_URL or not config.NEMOTRON_MODEL:
        raise RuntimeError("Nemotron endpoint is not configured")
    headers = {}
    key = config.nemotron_key()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    payload = {
        "model": config.NEMOTRON_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }
    url = config.NEMOTRON_BASE_URL.rstrip("/") + "/chat/completions"
    async with httpx.AsyncClient(timeout=timeout_s, transport=_transport) as http:
        response = await http.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
