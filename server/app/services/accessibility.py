"""Partial accessibility update shared by contacts and patients. Owner: person 2."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app import db

ACCESSIBILITY_FIELDS = ("read_aloud", "voice_mode", "text_size", "high_contrast")
LANGUAGES = ("fi", "sv", "en")
TEXT_SIZES = ("m", "l", "xl")


async def patch_accessibility(table: str, doc_id: str, body: dict[str, Any]) -> dict[str, Any]:
    """Merge only the accessibility fields present in `body`; `language` is a top-level field."""
    doc = await db.get(table, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="not found")
    if "text_size" in body and body["text_size"] not in TEXT_SIZES:
        raise HTTPException(status_code=422, detail="text_size must be m, l or xl")
    if "language" in body and body["language"] not in LANGUAGES:
        raise HTTPException(status_code=422, detail="language must be fi, sv or en")
    accessibility = {**doc["accessibility"], **{k: body[k] for k in ACCESSIBILITY_FIELDS if k in body}}
    patch: dict[str, Any] = {"accessibility": accessibility}
    if "language" in body:
        patch["language"] = body["language"]
    updated = await db.update(table, doc_id, patch)
    assert updated is not None
    return updated
