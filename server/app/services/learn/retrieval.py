"""Keyword / BM25-style scoring over the corpus in the question's language; top 1–3 passages
above a minimum score. No embeddings."""

from __future__ import annotations


def search(question: str, language: str, *, k: int = 3) -> list[dict]:
    raise NotImplementedError
