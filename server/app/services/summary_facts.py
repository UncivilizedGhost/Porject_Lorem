"""Fact list for the Insight Card AI summary. Owner: person 1.

Every figure the model may cite is a fact `{ id, text, value, source_url? }`. Facts from
suppressed breakdown cells (n < 5) are never built, so they can't reach the prompt.
`fallback_sentences` writes the summary from the same facts when the model is unavailable.
"""

from __future__ import annotations

import re
from typing import Any

SUPPRESS_BELOW = 5

SYSTEM_PROMPT = (
    "You explain an equity dashboard card about one demographic group to a county team. Use only "
    "the numbered facts you are given. Write at most 4 short sentences in plain English. End every "
    "sentence with the ids of the facts it uses in square brackets, like [group_pct, county_pct]. "
    "Be precise and unambiguous. Copy every figure exactly as the fact gives it; never round, add, "
    "subtract or otherwise calculate a figure. Say what each percentage is a percentage of. Compare "
    "the group with the county only by quoting the group_vs_county fact, keeping its 'below' or "
    "'above'; never call a difference a 'gap'. Write each Cause Code name exactly as quoted in its "
    "fact, in quotes, with its share. Name each action by its title; for an action without an "
    "effect estimate say 'no published effect estimate'. Do not invent actions. "
    "All figures are synthetic demo data."
)

# Cause Codes as they are worded in every fact and sentence.
CAUSE_LABEL = {
    "unconfirmed": "visit not confirmed",
    "transport": "no transport to the visit",
    "waiting_for_slot": "waiting for a slot",
}


MAX_SENTENCES = 4
_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_GAP = re.compile(r"\bgaps?\b", re.I)


def mid_sentence(who: str) -> str:
    """'People aged 85 and over' → 'people aged …'; proper nouns such as 'Russian speakers' keep their capital."""
    return who[0].lower() + who[1:] if who.startswith(("People", "Speakers", "Patients")) else who


def _num(value: float) -> str:
    """One decimal, without a trailing .0: 53.6, 21.5, 43."""
    return f"{value:.1f}".removesuffix(".0")


def _cause(code: str) -> str:
    return CAUSE_LABEL.get(code, code.replace("_", " "))


def _versus_county(group_pct: float, county_pct: float) -> str:
    diff = round(group_pct - county_pct, 1)
    if diff == 0:
        return "the same as the county rate"
    return f"{_num(abs(diff))} percentage points {'below' if diff < 0 else 'above'} the county rate"


def _slug(label: str) -> str:
    return label.replace(" ", "_")


def _effect(action: dict[str, Any]) -> str:
    eff = action["effect"]
    return f"{_num(eff['low'] * 100)}% to {_num(eff['high'] * 100)}% fewer missed visits"


def build_facts(card: dict[str, Any], county: dict[str, Any], actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    base = card["baseline"]
    where = card["where"]
    who = mid_sentence(card["who"])
    pct, county_pct = base["pct_within_target"], county["pct_within_target"]
    facts: list[dict[str, Any]] = [
        {"id": "group_pct", "value": pct,
         "text": f"{_num(pct)}% of {who} in {where} start treatment within the 6-week target (n={base['n']})"},
        {"id": "county_pct", "value": county_pct,
         "text": f"{_num(county_pct)}% of all patients in {where} start treatment within the 6-week target"},
        {"id": "group_vs_county", "value": round(pct - county_pct, 1),
         "text": f"The share of {who} starting treatment within the 6-week target is {_versus_county(pct, county_pct)}"},
    ]
    missed = base.get("missed_visits")
    if missed:
        facts += [
            {"id": "missed_share", "value": missed["share"],
             "text": f"{_num(missed['share'])}% of {mid_sentence(missed['who'])} in {where} start treatment late because they miss the first visit"},
            {"id": "days_lost", "value": missed["days_lost"],
             "text": f"A missed first visit delays the start of treatment by about {_num(missed['days_lost'])} days"},
        ]
    for cause, share in county["causes"].get(card["stage"], {}).items():
        facts.append({"id": f"cause_{cause}", "value": share,
                      "text": f"{_num(share * 100)}% of delayed {card['stage']} stages in {where} have the Cause Code '{_cause(cause)}'"})
    for dimension, cells in county["breakdown"].items():
        for label, cell in cells.items():
            if cell.get("suppressed") or cell["n"] < SUPPRESS_BELOW:
                continue  # suppressed: never sent to the model
            facts.append({"id": f"{dimension}_{_slug(label)}", "value": cell["pct_within_target"],
                          "text": f"{_num(cell['pct_within_target'])}% of {dimension.replace('_', ' ')} group '{label}' start treatment within the 6-week target (n={cell['n']})"})
    for a in actions:
        if a["effect"]:
            text = f"Action '{a['title']}': the cited evidence shows {_effect(a)} (evidence badge: {a['badge'].replace('_', ' ')})"
        else:
            text = f"Action '{a['title']}': no published effect estimate (evidence badge: {a['badge'].replace('_', ' ')})"
        fact = {"id": f"action_{a['_id']}", "value": a["badge"], "text": text}
        if a["evidence"]:
            fact["source_url"] = a["evidence"][0]["url"]
        facts.append(fact)
    return facts


def fallback_sentences(card: dict[str, Any], county: dict[str, Any], actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Built from the same numbers as the facts, so the two cannot disagree."""
    base = card["baseline"]
    pct, county_pct = base["pct_within_target"], county["pct_within_target"]
    sentences = [{
        "text": (f"In {card['where']}, {_num(pct)}% of {mid_sentence(card['who'])} start treatment within the "
                 f"6-week target (n={base['n']}), which is {_versus_county(pct, county_pct)} of {_num(county_pct)}%"),
        "fact_ids": ["group_pct", "county_pct", "group_vs_county"],
    }]
    missed = base.get("missed_visits")
    if missed:
        sentences.append({
            "text": (f"{_num(missed['share'])}% of {mid_sentence(missed['who'])} start treatment late because they miss "
                     f"the first visit, which delays the start by about {_num(missed['days_lost'])} days"),
            "fact_ids": ["missed_share", "days_lost"],
        })
    causes = county["causes"].get(card["stage"], {})
    if causes:
        cause, share = max(causes.items(), key=lambda item: item[1])
        sentences.append({
            "text": (f"The most common Cause Code for delayed {card['stage']} stages in {card['where']} is "
                     f"'{_cause(cause)}', at {_num(share * 100)}% of them"),
            "fact_ids": [f"cause_{cause}"],
        })
    with_effect = next((a for a in actions if a["effect"]), None)
    if with_effect:
        sentences.append({
            "text": f"For the action '{with_effect['title']}', the cited evidence shows {_effect(with_effect)}",
            "fact_ids": [f"action_{with_effect['_id']}"],
        })
    return sentences


def precise_sentences(sentences: list[dict[str, Any]], facts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keeps a model sentence only when its wording can be checked against the facts it cites:
    every figure appears in one of those facts, a comparison with the county carries the fact's
    own 'N percentage points below/above the county rate', and the word 'gap' is not used.
    Repeats are dropped; at most MAX_SENTENCES are kept."""
    by_id = {f["id"]: f["text"] for f in facts}
    kept: list[dict[str, Any]] = []
    seen: set[str] = set()
    for sentence in sentences:
        text = sentence["text"]
        cited = [by_id[i] for i in sentence["fact_ids"] if i in by_id]
        allowed = {n for fact in cited for n in _NUMBER.findall(fact)}
        if text in seen or _GAP.search(text) or not set(_NUMBER.findall(text)) <= allowed:
            continue
        if "group_vs_county" in sentence["fact_ids"] and by_id["group_vs_county"].split(" is ", 1)[1] not in text:
            continue
        seen.add(text)
        kept.append(sentence)
    return kept[:MAX_SENTENCES]


def build_prompt(facts: list[dict[str, Any]]) -> str:
    return "Facts:\n" + "\n".join(f"[{f['id']}] {f['text']}" for f in facts)
