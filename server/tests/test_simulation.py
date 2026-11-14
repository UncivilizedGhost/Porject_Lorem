"""Person 1, seam 1 (pure modules). See .scratch/equity-dashboard/spec.md.

simulation: never a single point; dial clamped; same lever → larger single effect, not sum;
null effect → simulated: false; "needed for 70%" beyond range → can't close the gap + best achievable.
summary_filter: no id → dropped; unknown id → dropped; valid id → kept with ids.
"""

from app.services.summary_filter import filter_sentences


def test_sentence_with_a_valid_fact_id_is_kept_with_its_ids():
    reply = "Over-75s start late [f1]. Reminders cut missed visits [f2, f3]."
    kept = filter_sentences(reply, {"f1", "f2", "f3"})
    assert kept == [
        {"text": "Over-75s start late", "fact_ids": ["f1"]},
        {"text": "Reminders cut missed visits", "fact_ids": ["f2", "f3"]},
    ]


def test_sentence_without_a_fact_id_is_dropped():
    assert filter_sentences("Nobody knows why [f1]. This is made up.", {"f1"}) == [
        {"text": "Nobody knows why", "fact_ids": ["f1"]}
    ]


def test_sentence_with_only_unknown_ids_is_dropped_and_unknown_ids_are_not_kept():
    kept = filter_sentences("Invented claim [zz9]. Half real [f1, zz9].", {"f1"})
    assert kept == [{"text": "Half real", "fact_ids": ["f1"]}]


# ---- simulation ----------------------------------------------------------------------------

from app.services.simulation import simulate  # noqa: E402

CARD = {
    "card_id": "western-uusimaa/missed-first-visits-75",
    "baseline": {
        "pct_within_target": 46.0,
        "n": 100,
        "missed_visit_share": 12.0,
        "days_lost_to_missed_visits": 14.0,
    },
}


def action(_id, lever="missed_visits", effect=(0.43, 0.215, 0.43)):
    eff = None
    if effect:
        published, low, high = effect
        eff = {"published": published, "low": low, "high": high, "range_rule": "half_to_full"}
    return {"_id": _id, "lever": lever, "effect": eff}


def test_a_simulated_action_reports_ranges_never_a_single_point():
    out = simulate(CARD, [action("reminders")], {})
    a = out["actions"]["reminders"]
    assert a["simulated"] is True
    for key in ("days_saved", "extra_within_target"):
        assert a[key]["low"] < a[key]["high"]
    assert out["combined"]["pct_within_target"]["low"] < out["combined"]["pct_within_target"]["high"]


def test_a_dial_outside_the_evidence_range_is_clamped_and_default_is_the_published_value():
    reminders = action("reminders", effect=(0.40, 0.20, 0.43))
    assert simulate(CARD, [reminders], {})["actions"]["reminders"]["assumed_effect"] == 0.40
    assert simulate(CARD, [reminders], {"reminders": 0.9})["actions"]["reminders"]["assumed_effect"] == 0.43
    assert simulate(CARD, [reminders], {"reminders": 0.0})["actions"]["reminders"]["assumed_effect"] == 0.20


def test_two_actions_on_the_same_lever_count_the_larger_effect_not_the_sum():
    small = action("small", effect=(0.20, 0.10, 0.20))
    large = action("large", effect=(0.40, 0.30, 0.40))
    both = simulate(CARD, [small, large], {})
    alone = simulate(CARD, [large], {})
    assert both["combined"]["pct_within_target"] == alone["combined"]["pct_within_target"]
    assert both["combined"]["lever_rule_applied"] == [
        {"lever": "missed_visits", "counted": "large", "not_counted": ["small"]}
    ]


def test_a_target_beyond_the_lever_says_it_cannot_close_the_gap_and_gives_the_best_achievable():
    # plan 4.5: over-75s start at 46%; even with no missed visits at all they reach 58%
    gap = simulate(CARD, [action("reminders")], {})["target_gap"]
    assert gap["max_achievable_pct"] == 58.0
    assert gap["needed_for_70"] == 2.0  # 200% fewer missed visits: impossible
    assert gap["reachable_70"] is False
    assert gap["reachable_80"] is False
    assert gap["evidence_max_effect"] == 0.43


def test_a_target_within_the_evidence_range_is_reachable():
    card = {"baseline": {**CARD["baseline"], "missed_visit_share": 60.0}}
    gap = simulate(card, [action("reminders")], {})["target_gap"]
    assert round(gap["needed_for_70"], 3) == 0.4
    assert gap["reachable_70"] is True
    assert gap["reachable_80"] is False


def test_a_lever_the_card_has_no_baseline_for_is_not_simulated():
    other = action("other", lever="days_sooner")
    out = simulate(CARD, [other], {})
    assert out["actions"]["other"] == {"simulated": False}
    assert out["combined"]["pct_within_target"] is None


def test_an_action_without_an_effect_is_not_simulated_and_carries_no_numbers():
    coordinator = action("coordinator", effect=None)
    out = simulate(CARD, [coordinator], {})
    assert out["actions"]["coordinator"] == {"simulated": False}
    # nothing simulated → the baseline range collapses to the baseline, which is a no-effect statement
    assert out["combined"]["pct_within_target"] is None
