"""Shared text normalisation for Learn (red flags and retrieval). Owner: person 4."""

from __future__ import annotations

import re
import unicodedata


def normalize(text: str) -> str:
    """Lowercase, drop apostrophes, strip diacritics (ä/ö/å -> a/o/a), punctuation to spaces."""
    text = text.lower().replace("'", "").replace("’", "")
    text = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def tokens(text: str) -> list[str]:
    return normalize(text).split()
