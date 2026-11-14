"""AI-summary sentence filter: a pure function. Owner: person 1.

filter_sentences(reply, valid_fact_ids) → [{ text, fact_ids }]
Splits the model reply into sentences, parses the bracketed fact ids on each, drops any
sentence without at least one valid id. Unknown ids count as missing.
"""

from __future__ import annotations

import re

_IDS = re.compile(r"\[([^\]]*)\]")
_SPLIT = re.compile(r"(?<=[.!?])\s+")


def filter_sentences(reply: str, valid_fact_ids: set[str]) -> list[dict]:
    kept = []
    for raw in _SPLIT.split(reply.strip()):
        ids = [i.strip() for group in _IDS.findall(raw) for i in group.split(",") if i.strip() in valid_fact_ids]
        if not ids:
            continue
        text = _IDS.sub("", raw).strip().rstrip(".!?").strip()
        kept.append({"text": text, "fact_ids": ids})
    return kept
