"""Fact list for the Insight Card AI summary. Owner: person 1.

Every figure the model may cite is a fact `{ id, text, value, source_url? }`. Facts from
suppressed breakdown cells (n < 5) are never built, so they can't reach the prompt.
"""

from __future__ import annotations

from typing import Any

SUPPRESS_BELOW = 5

SYSTEM_PROMPT = (
    "You explain an equity dashboard card to a county decision-maker. Use only the numbered "
    "facts you are given. Write at most 4 short sentences in plain English. End every sentence "
    "with the ids of the facts it uses in square brackets, like [group_pct, days_lost]. "
    "Never recommend an action; describe the gap and what the evidence shows. "
    "All figures are synthetic demo data."
)


def _slug(label: str) -> str:
    return label.replace(" ", "_")


def build_facts(card: dict[str, Any], county: dict[str, Any], actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    base = card["baseline"]
    where = card["where"]
    facts: list[dict[str, Any]] = [
        {"id": "group_pct", "value": base["pct_within_target"],
         "text": f"{base['pct_within_target']:.0f}% of {card['who'].lower()} in {where} start treatment within the target (n={base['n']})"},
        {"id": "county_pct", "value": county["pct_within_target"],
         "text": f"{county['pct_within_target']:.0f}% of all patients in {where} start treatment within the target"},
        {"id": "reach_75", "value": county["reach_rate_over_75"],
         "text": f"{county['reach_rate_over_75']:.0f}% of over-75s are reached in {where}"},
        {"id": "missed_share", "value": base["missed_visit_share"],
         "text": f"{base['missed_visit_share']:.0f}% of this group start late because they miss the first visit"},
        {"id": "days_lost", "value": base["days_lost_to_missed_visits"],
         "text": f"A missed first visit costs about {base['days_lost_to_missed_visits']:.0f} days"},
        {"id": "max_achievable", "value": base["pct_within_target"] + base["missed_visit_share"],
         "text": f"Even with no missed first visits this group would reach {base['pct_within_target'] + base['missed_visit_share']:.0f}% within target"},
    ]
    for cause, share in county["causes"].get(card["stage"], {}).items():
        facts.append({"id": f"cause_{cause}", "value": share,
                      "text": f"{share * 100:.0f}% of delayed {card['stage']} stages are Cause Code '{cause.replace('_', ' ')}'"})
    for dimension, cells in county["breakdown"].items():
        for label, cell in cells.items():
            if cell["n"] < SUPPRESS_BELOW:
                continue  # suppressed: never sent to the model
            facts.append({"id": f"{dimension}_{_slug(label)}", "value": cell["pct_within_target"],
                          "text": f"{cell['pct_within_target']:.0f}% of {dimension.replace('_', ' ')} group '{label}' within target (n={cell['n']})"})
    for a in actions:
        eff = a["effect"]
        if eff:
            text = (f"{a['title']}: evidence shows {eff['low'] * 100:.0f}-{eff['high'] * 100:.0f}% fewer missed visits "
                    f"(badge: {a['badge']})")
        else:
            text = f"{a['title']}: evidence badge {a['badge']}, no effect estimate"
        fact = {"id": f"action_{a['_id']}", "value": a["badge"], "text": text}
        if a["evidence"]:
            fact["source_url"] = a["evidence"][0]["url"]
        facts.append(fact)
    return facts


def build_prompt(facts: list[dict[str, Any]]) -> str:
    return "Facts:\n" + "\n".join(f"[{f['id']}] {f['text']}" for f in facts)
