"""Insight Card for one breakdown group: pure functions over fixtures. Owner: person 1.

build_card(county, dimension, group, cell, fixture_cards) → what / where / who / stage / cause / baseline
recommend(card, county, actions) → Action Library entries whose gap pattern fits the group, each
with `recommended_because`: the plain-text origin of the recommendation.
Rules: group-specific actions first, then the ones that cover every group. No model is involved.
"""

from __future__ import annotations

from typing import Any

from app.services.summary_facts import CAUSE_LABEL, mid_sentence

# Breakdown groups → the group tag used by Action Library gap patterns and the fixture cards.
GROUP_TAGS = {
    ("age", "75+"): "75+",
    ("age", "75-84"): "75+",
    ("age", "85+"): "75+",
    ("education_group", "basic"): "low_education",
    # Mother tongue other than Finnish or Swedish (National Cancer Strategy 1.3).
    ("language", "Russian"): "other_language",
    ("language", "Estonian"): "other_language",
    ("language", "Ukrainian"): "other_language",
    ("language", "Arabic"): "other_language",
    ("language", "Other"): "other_language",
}
# Phases whose group-less actions apply to any group's late start.
GENERAL_PHASES = ("referral", "pathway")
DEFAULT_STAGE = "referral"
DEFAULT_WHAT = "Late start of treatment"


def card_id(county_id: str, dimension: str, group: str) -> str:
    return f"{county_id}/{dimension}/{group}"


def who(dimension: str, group: str) -> str:
    if dimension == "age":
        return f"People aged {group[:-1]} and over" if group.endswith("+") else f"People aged {group}"
    if dimension == "language":
        return "Speakers of other languages" if group == "Other" else f"{group} speakers"
    if dimension == "education_group":
        return f"People with {group} education"
    if dimension == "municipality_type":
        return f"People in {group} municipalities"
    if dimension == "ethnicity":
        return "Patients whose ethnicity is not recorded" if group == "Not recorded" else f"{group} patients"
    return group


def build_card(
    county: dict[str, Any], dimension: str, group: str, cell: dict[str, Any], fixture_cards: list[dict[str, Any]]
) -> dict[str, Any]:
    """`cell` is the group's unsuppressed breakdown cell. A fixture card for the same county and
    group tag adds what it knows: the gap's name, its Cause Code and the missed-visit figures."""
    tag = GROUP_TAGS.get((dimension, group))
    known = next((c for c in fixture_cards if c["where"] == county["name"] and tag and c["group"] == tag), None)
    baseline = {"pct_within_target": cell["pct_within_target"], "n": cell["n"], "small_sample": cell["small_sample"]}
    card = {
        "what": DEFAULT_WHAT,
        "where": county["name"],
        "who": who(dimension, group),
        "dimension": dimension,
        "group": group,
        "group_tag": tag,
        "stage": DEFAULT_STAGE,
        "cause": None,
        "baseline": baseline,
    }
    if known:
        card |= {"what": known["what"], "stage": known["stage"], "cause": known["cause"]}
        # Measured on the fixture card's wider group, so the facts name that group.
        baseline["missed_visits"] = {
            "who": known["who"],
            "share": known["baseline"]["missed_visit_share"],
            "days_lost": known["baseline"]["days_lost_to_missed_visits"],
        }
    return card


def _because(action: dict[str, Any], card: dict[str, Any], county: dict[str, Any]) -> str:
    pattern = action["gap_pattern"]
    phase = pattern["phase"]
    where = "the whole pathway" if phase == "pathway" else f"the {phase} stage"
    if pattern["group"]:
        text = f"Its gap pattern in the Action Library targets {mid_sentence(card['who'])} at {where}"
    else:
        text = f"Its gap pattern in the Action Library covers every group at {where}"
    if pattern["cause"]:
        share = county["causes"][phase][pattern["cause"]] * 100
        label = CAUSE_LABEL.get(pattern["cause"], pattern["cause"])
        text += f", where {share:.0f}% of delayed {phase} stages in {county['name']} have the Cause Code '{label}'"
    return text + "."


def _fits(pattern: dict[str, Any], card: dict[str, Any], county: dict[str, Any]) -> bool:
    """Group-specific patterns fit their group at any phase; group-less ones fit at the general
    phases. A pattern's Cause Code must be one the county records at that phase."""
    if pattern["cause"] is not None and pattern["cause"] not in county["causes"].get(pattern["phase"], {}):
        return False
    if pattern["group"] is not None:
        return pattern["group"] == card["group_tag"]
    return pattern["phase"] in GENERAL_PHASES


def recommend(card: dict[str, Any], county: dict[str, Any], actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    fitting = [a for a in actions if _fits(a["gap_pattern"], card, county)]
    fitting.sort(key=lambda a: a["gap_pattern"]["group"] is None)  # stable: group-specific first
    return [{**a, "recommended_because": _because(a, card, county)} for a in fitting]
