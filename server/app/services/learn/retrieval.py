"""Keyword / BM25-style scoring over the corpus in the question's language; top 1–3 passages
above a minimum score. No embeddings."""

from __future__ import annotations

import math
from collections import Counter

from app.services.learn import corpus
from app.services.learn.text import tokens

MIN_SCORE = 0.5
STEM_LEN = 6  # crude prefix stemming so Finnish/Swedish inflections still match
K1 = 1.5
B = 0.75

STOPWORDS: dict[str, set[str]] = {
    "en": set(
        "a an the is are was were be what whats how why when where who which do does did i me my "
        "you your it of to in on for and or about can could should would will with at by from as "
        "this that there tell explain mean means".split()
    ),
    "fi": set(
        "mika mita on ovat oli ole olen kuka milloin missa miten miksi ja tai etta se ne tama "
        "tuo minun sinun mina sina kerro selita tarkoittaa voi voiko".split()
    ),
    "sv": set(
        "vad ar var vem nar hur varfor och eller att det den detta jag du min din mitt ditt en ett "
        "om i pa for med av som kan ska beratta forklara betyder".split()
    ),
}


def _terms(text: str, language: str) -> list[str]:
    stop = STOPWORDS.get(language, set())
    return [t[:STEM_LEN] for t in tokens(text) if t not in stop and len(t) > 1]


def search(question: str, language: str, *, k: int = 3) -> list[dict]:
    docs = corpus.passages(language)
    query = set(_terms(question, language))
    if not docs or not query:
        return []
    doc_terms = [Counter(_terms(f"{d['title']} {d['title']} {d['text']}", language)) for d in docs]
    avg_len = sum(sum(c.values()) for c in doc_terms) / len(docs)
    scored: list[tuple[float, dict]] = []
    for doc, counts in zip(docs, doc_terms, strict=True):
        length = sum(counts.values())
        score = 0.0
        for term in query:
            tf = counts.get(term, 0)
            if not tf:
                continue
            df = sum(1 for c in doc_terms if term in c)
            idf = math.log(1 + (len(docs) - df + 0.5) / (df + 0.5))
            score += idf * tf * (K1 + 1) / (tf + K1 * (1 - B + B * length / avg_len))
        if score >= MIN_SCORE:
            scored.append((score, doc))
    scored.sort(key=lambda s: s[0], reverse=True)
    return [d for _, d in scored[:k]]
