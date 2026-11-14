"""AI-summary sentence filter: a pure function. Owner: person 1.

filter_sentences(reply, valid_fact_ids) → [{ text, fact_ids }]
Splits the model reply into sentences, parses the bracketed fact ids on each, drops any
sentence without at least one valid id. Unknown ids count as missing.
"""

from __future__ import annotations


def filter_sentences(reply: str, valid_fact_ids: set[str]) -> list[dict]:
    raise NotImplementedError
