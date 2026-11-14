"""Person 1, seam 2 (HTTP, fixtures seeded). See .scratch/equity-dashboard/spec.md.

- GET /dashboard/counties returns 22 incl. Western Uusimaa
- an n < 5 cell comes back suppressed with no value
- GET /dashboard/counties/{name}/insight gives one breakdown group its card and Recommended Actions
- POST /dashboard/summary with the model stubbed (one cited + one uncited sentence) keeps only
  the cited one and never puts a suppressed fact in the prompt
- model stubbed to time out → source: "rules"
"""

import pytest

from app.fixtures.seed import ensure_fixtures

CARD = "western-uusimaa/missed-first-visits-75"
INSIGHT = "/dashboard/counties/Western Uusimaa/insight"
OLDEST = {"county": "Western Uusimaa", "dimension": "age", "group": "85+"}


@pytest.fixture(scope="module", autouse=True)
async def _seeded():
    await ensure_fixtures()


async def test_counties_lists_all_22_including_western_uusimaa(client):
    r = await client.get("/dashboard/counties")
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert len(names) == 22
    assert "Western Uusimaa" in names


async def test_county_cell_under_five_is_suppressed_with_no_value(client):
    body = (await client.get("/dashboard/counties/Western Uusimaa")).json()
    other = body["breakdown"]["language"]["Other"]  # n = 4 in the fixture
    assert other == {"suppressed": True}


async def test_a_cell_stored_already_suppressed_stays_suppressed_and_its_county_still_loads(client):
    r = await client.get("/dashboard/counties/Kymenlaakso")
    assert r.status_code == 200
    assert r.json()["breakdown"]["language"]["Swedish"] == {"suppressed": True}
    params = {"dimension": "language", "group": "Swedish"}
    assert (await client.get("/dashboard/counties/Kymenlaakso/insight", params=params)).status_code == 422
    oldest = await client.get("/dashboard/counties/Kymenlaakso/insight", params={"dimension": "age", "group": "75+"})
    assert oldest.status_code == 200
    assert oldest.json()["recommended_actions"][0]["_id"] == "reminders_nurse_call"  # counties with one 75+ band


async def test_summary_for_a_county_with_a_stored_suppressed_cell_is_built(client, model):
    model.error = TimeoutError()
    r = await client.post("/dashboard/summary", json={"county": "Kymenlaakso", "dimension": "age", "group": "75+"})
    assert r.status_code == 200
    assert "language_Swedish" not in {f["id"] for f in r.json()["facts"]}


async def test_county_cell_under_twenty_carries_a_small_sample_warning(client):
    body = (await client.get("/dashboard/counties/Western Uusimaa")).json()
    swedish = body["breakdown"]["language"]["Swedish"]  # n = 14 in the fixture
    assert swedish["small_sample"] is True
    assert swedish["n"] == 14
    assert body["breakdown"]["age"]["75+"]["small_sample"] is False


async def test_action_library_has_the_six_rows_and_single_site_badge_for_the_danish_study(client):
    actions = {a["_id"]: a for a in (await client.get("/dashboard/actions")).json()}
    assert len(actions) == 6
    assert actions["reminders_nurse_call"]["badge"] == "single_site"  # [43] is single-site, verified
    assert actions["named_coordinator"]["effect"] is None


async def test_group_insight_card_recommends_group_specific_actions_first_and_says_why(client):
    r = await client.get(INSIGHT, params={"dimension": "age", "group": "85+"})
    assert r.status_code == 200
    body = r.json()
    assert body["card_id"] == "western-uusimaa/age/85+"
    assert body["where"] == "Western Uusimaa"
    assert body["who"] == "People aged 85 and over"
    assert body["what"] == "Missed first visits"  # the fixture card for over-75s covers this band
    assert body["baseline"]["n"] == 105
    assert set(body["cause_shares"]) == {"unconfirmed", "transport", "waiting_for_slot"}
    recommended = body["recommended_actions"]
    assert [a["_id"] for a in recommended][0] == "reminders_nurse_call"
    assert {a["_id"] for a in recommended} == {
        "reminders_nurse_call", "named_coordinator", "national_pathway_time_limits"
    }
    assert "targets people aged 85 and over" in recommended[0]["recommended_because"]
    assert "21% of delayed referral stages in Western Uusimaa have the Cause Code 'visit not confirmed'" in recommended[0]["recommended_because"]
    assert all("Action Library" in a["recommended_because"] for a in recommended)


async def test_group_without_a_specific_gap_pattern_gets_the_actions_that_cover_every_group(client):
    body = (await client.get(INSIGHT, params={"dimension": "municipality_type", "group": "rural"})).json()
    assert body["who"] == "People in rural municipalities"
    assert body["what"] == "Late start of treatment"
    assert {a["_id"] for a in body["recommended_actions"]} == {"named_coordinator", "national_pathway_time_limits"}
    assert all("every group" in a["recommended_because"] for a in body["recommended_actions"])


async def test_other_language_groups_are_recommended_the_strategy_action_for_language_groups(client):
    body = (await client.get(INSIGHT, params={"dimension": "language", "group": "Russian"})).json()
    assert body["who"] == "Russian speakers"
    first = body["recommended_actions"][0]
    assert first["_id"] == "language_group_communication"
    assert first["roadmap_action"].startswith("National Cancer Strategy 1.3")
    assert "targets Russian speakers at the detection stage" in first["recommended_because"]
    assert {a["_id"] for a in body["recommended_actions"][1:]} == {"named_coordinator", "national_pathway_time_limits"}
    for group in ("Finnish", "Swedish"):  # the strategy measure is about other mother tongues
        domestic = (await client.get(INSIGHT, params={"dimension": "language", "group": group})).json()
        assert "language_group_communication" not in {a["_id"] for a in domestic["recommended_actions"]}


async def test_low_education_group_is_recommended_the_risk_check_action(client):
    body = (await client.get(INSIGHT, params={"dimension": "education_group", "group": "basic"})).json()
    assert body["recommended_actions"][0]["_id"] == "risk_check_warning_tap"


async def test_unknown_group_is_404_and_a_suppressed_group_is_422(client):
    assert (await client.get(INSIGHT, params={"dimension": "age", "group": "0-17"})).status_code == 404
    assert (await client.get(INSIGHT, params={"dimension": "shoe_size", "group": "44"})).status_code == 404
    assert (await client.get(INSIGHT, params={"dimension": "language", "group": "Other"})).status_code == 422
    assert (
        await client.get("/dashboard/counties/Atlantis/insight", params={"dimension": "age", "group": "85+"})
    ).status_code == 404


async def test_simulate_returns_ranges_and_says_the_gap_cannot_close(client):
    r = await client.post("/dashboard/simulate", json={"card_id": CARD, "dials": {"reminders_nurse_call": 0.3}})
    assert r.status_code == 200
    body = r.json()
    reminders = body["actions"]["reminders_nurse_call"]
    assert reminders["assumed_effect"] == 0.3
    assert reminders["days_saved"]["low"] < reminders["days_saved"]["high"]
    assert body["actions"]["named_coordinator"] == {"simulated": False}
    assert body["target_gap"]["reachable_70"] is False
    assert body["target_gap"]["max_achievable_pct"] == 58.0


@pytest.fixture
def model(monkeypatch):
    """Stub the Nemotron client: records prompts, replies with whatever the test sets."""
    from app.services import nemotron

    stub = type("Model", (), {"reply": "", "error": None, "prompts": []})()

    async def fake_complete(system, user, *, timeout_s=None):
        stub.prompts.append((system, user))
        if stub.error:
            raise stub.error
        return stub.reply

    monkeypatch.setattr(nemotron, "complete", fake_complete)
    return stub


async def test_summary_keeps_only_the_sentence_with_a_valid_fact_id(client, model):
    model.reply = "The oldest start late [group_pct]. This sentence cites nothing."
    body = (await client.post("/dashboard/summary", json=OLDEST)).json()
    assert body["source"] == "live"
    assert [s["fact_ids"] for s in body["sentences"]] == [["group_pct"]]
    assert "cites nothing" not in str(body["sentences"])
    assert {f["id"] for f in body["facts"]} >= {"group_pct", "action_reminders_nurse_call"}


async def test_summary_prompt_never_contains_a_suppressed_fact(client, model):
    model.reply = "The oldest start late [group_pct]."
    await client.post("/dashboard/summary", json=OLDEST)
    _, user_prompt = model.prompts[-1]
    assert "language_Ukrainian" in user_prompt  # n = 8: small sample, still shared
    assert "language_Other" not in user_prompt  # n = 3: suppressed, never sent to the model


async def test_summary_is_built_from_the_facts_when_the_model_times_out(client, model):
    model.error = TimeoutError()
    body = (await client.post("/dashboard/summary", json=OLDEST)).json()
    assert body["source"] == "rules"
    fact_ids = {f["id"] for f in body["facts"]}
    assert len(body["sentences"]) == 4  # gap, missed visits, top Cause Code, evidence
    assert all(set(s["fact_ids"]) <= fact_ids for s in body["sentences"])
    first = body["sentences"][0]["text"]
    assert "29.7% of people aged 85 and over" in first  # unrounded, as the fixture has it
    assert "23.9 percentage points below the county rate of 53.6%" in first
    assert "'waiting for a slot', at 55% of them" in body["sentences"][2]["text"]
    assert "21.5% to 43% fewer missed visits" in body["sentences"][3]["text"]


async def test_pregenerated_summary_is_served_without_calling_the_model(client, model, monkeypatch):
    from app.fixtures import seed

    monkeypatch.setattr(seed, "pregenerated_summaries", lambda: {"western-uusimaa/age/85+": [
        {"text": "The oldest start late", "fact_ids": ["group_pct"]},
        {"text": "This one cites a fact that no longer exists", "fact_ids": ["gone"]},
    ]})
    body = (await client.post("/dashboard/summary", json=OLDEST)).json()
    assert body["source"] == "pregenerated"
    assert body["sentences"] == [{"text": "The oldest start late", "fact_ids": ["group_pct"]}]
    assert model.prompts == []


async def test_summary_facts_state_the_direction_of_the_difference_and_name_cause_codes_in_full(client, model):
    model.error = TimeoutError()
    above = (await client.post("/dashboard/summary", json={**OLDEST, "group": "18-39"})).json()
    facts = {f["id"]: f["text"] for f in above["facts"]}
    assert "18.8 percentage points above the county rate" in facts["group_vs_county"]
    assert "have the Cause Code 'visit not confirmed'" in facts["cause_unconfirmed"]
    assert "no published effect estimate" in facts["action_named_coordinator"]
    assert "above the county rate" in above["sentences"][0]["text"]


async def test_summary_drops_a_model_sentence_whose_figures_or_comparison_the_facts_do_not_back(client, model):
    model.reply = (
        "29.7% of people aged 85 and over start treatment within the 6-week target [group_pct]. "
        "That is a 24-point gap to the county [group_vs_county]. "
        "About 30% of them start in time [group_pct]. "
        "Their share is 23.9 percentage points below the county rate [group_vs_county]. "
        "Their share is 23.9 percentage points below the county rate [group_vs_county]."
    )
    body = (await client.post("/dashboard/summary", json=OLDEST)).json()
    assert body["source"] == "live"
    assert [s["text"] for s in body["sentences"]] == [
        "29.7% of people aged 85 and over start treatment within the 6-week target",
        "Their share is 23.9 percentage points below the county rate",
    ]


async def test_group_names_keep_their_capitals_inside_a_sentence(client, model):
    model.error = TimeoutError()
    russian = (await client.post("/dashboard/summary", json={**OLDEST, "dimension": "language", "group": "Russian"})).json()
    assert "39.8% of Russian speakers start" in russian["sentences"][0]["text"]
    unrecorded = (
        await client.post("/dashboard/summary", json={**OLDEST, "dimension": "ethnicity", "group": "Not recorded"})
    ).json()
    assert "47.2% of patients whose ethnicity is not recorded start" in unrecorded["sentences"][0]["text"]


async def test_summary_falls_back_to_the_facts_when_no_sentence_survives_the_filter(client, model):
    model.reply = "Entirely uncited. Also uncited [made_up_id]."
    body = (await client.post("/dashboard/summary", json=OLDEST)).json()
    assert body["source"] == "rules"


async def test_summary_for_a_suppressed_group_is_422(client, model):
    r = await client.post("/dashboard/summary", json={**OLDEST, "dimension": "language", "group": "Other"})
    assert r.status_code == 422
    assert model.prompts == []


async def test_decision_endpoints_are_gone(client):
    assert (await client.get("/dashboard/decisions", params={"card_id": CARD})).status_code == 404
    assert (await client.post("/dashboard/decisions", json={})).status_code in (404, 405)


async def test_unknown_county_is_404(client):
    assert (await client.get("/dashboard/counties/Atlantis")).status_code == 404
