"""Person 1, seam 2 (HTTP, fixtures seeded). See .scratch/equity-dashboard/spec.md.

- GET /dashboard/counties returns 22 incl. Western Uusimaa
- an n < 5 cell comes back suppressed with no value
- POST /dashboard/summary with the model stubbed (one cited + one uncited sentence) keeps only
  the cited one and never puts a suppressed fact in the prompt
- model stubbed to time out → source: "cached"
- decision with blank reason → 422; a valid one is first in GET /dashboard/decisions
"""

import pytest

from app.fixtures.seed import ensure_fixtures

CARD = "western-uusimaa/missed-first-visits-75"


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


async def test_county_cell_under_twenty_carries_a_small_sample_warning(client):
    body = (await client.get("/dashboard/counties/Western Uusimaa")).json()
    swedish = body["breakdown"]["language"]["Swedish"]  # n = 14 in the fixture
    assert swedish["small_sample"] is True
    assert swedish["n"] == 14
    assert body["breakdown"]["age"]["75+"]["small_sample"] is False


async def test_action_library_has_the_five_rows_and_single_site_badge_for_the_danish_study(client):
    actions = {a["_id"]: a for a in (await client.get("/dashboard/actions")).json()}
    assert len(actions) == 5
    assert actions["reminders_nurse_call"]["badge"] == "single_site"  # [43] is single-site, verified
    assert actions["named_coordinator"]["effect"] is None


async def test_insight_card_matches_exactly_the_reminder_and_coordinator_actions(client):
    r = await client.get(f"/dashboard/insight/{CARD}")
    assert r.status_code == 200
    body = r.json()
    assert body["where"] == "Western Uusimaa"
    assert {a["_id"] for a in body["matched_actions"]} == {"reminders_nurse_call", "named_coordinator"}


async def test_unknown_insight_card_is_404(client):
    assert (await client.get("/dashboard/insight/nowhere/none")).status_code == 404


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
    model.reply = "Over-75s start late [group_pct]. This sentence cites nothing."
    body = (await client.post("/dashboard/summary", json={"card_id": CARD})).json()
    assert body["source"] == "live"
    assert [s["fact_ids"] for s in body["sentences"]] == [["group_pct"]]
    assert "cites nothing" not in str(body["sentences"])
    assert {f["id"] for f in body["facts"]} >= {"group_pct"}


async def test_summary_prompt_never_contains_a_suppressed_fact(client, model):
    model.reply = "Over-75s start late [group_pct]."
    await client.post("/dashboard/summary", json={"card_id": CARD})
    _, user_prompt = model.prompts[-1]
    assert "language_Swedish" in user_prompt  # n = 14: small sample, still shared
    assert "language_Other" not in user_prompt  # n = 4: suppressed, never sent to the model


async def test_summary_falls_back_to_the_cached_text_when_the_model_times_out(client, model):
    model.error = TimeoutError()
    body = (await client.post("/dashboard/summary", json={"card_id": CARD})).json()
    assert body["source"] == "cached"
    fact_ids = {f["id"] for f in body["facts"]}
    assert len(body["sentences"]) == 4  # the fixture's cached text, none dropped for a stale id
    assert all(set(s["fact_ids"]) <= fact_ids for s in body["sentences"])


async def test_pregenerated_summary_is_served_without_calling_the_model(client, model):
    from app import db

    await db.update("insight_cards", CARD, {"pregenerated_summary": [
        {"text": "Over-75s start late", "fact_ids": ["group_pct"]},
        {"text": "This one cites a fact that no longer exists", "fact_ids": ["gone"]},
    ]})
    body = (await client.post("/dashboard/summary", json={"card_id": CARD})).json()
    assert body["source"] == "pregenerated"
    assert body["sentences"] == [{"text": "Over-75s start late", "fact_ids": ["group_pct"]}]
    assert model.prompts == []


async def test_summary_falls_back_to_cached_when_no_sentence_survives_the_filter(client, model):
    model.reply = "Entirely uncited. Also uncited [made_up_id]."
    body = (await client.post("/dashboard/summary", json={"card_id": CARD})).json()
    assert body["source"] == "cached"


def decision(**over):
    body = {
        "card_id": CARD,
        "action_ids": ["reminders_nurse_call"],
        "verdict": "approve",
        "reason": "Cheapest lever with a published effect",
        "owner": "County coordinator team",
        "due": "2026-12-15",
        "decided_by": "county-viewer",
        "snapshot": {"facts": [{"id": "group_pct"}], "simulation": {}, "badges": {"reminders_nurse_call": "single_site"}},
    }
    return {**body, **over}


@pytest.mark.parametrize("over", [{"reason": ""}, {"reason": "   "}, {"verdict": "maybe"}])
async def test_decision_with_blank_reason_or_unknown_verdict_is_422(client, over):
    assert (await client.post("/dashboard/decisions", json=decision(**over))).status_code == 422


async def test_a_recorded_decision_is_listed_first_with_the_demo_day(client):
    await client.post("/dashboard/decisions", json=decision(reason="first decision"))
    created = await client.post("/dashboard/decisions", json=decision(verdict="adapt", reason="second decision"))
    assert created.status_code == 201
    assert isinstance(created.json()["demo_day"], int)
    listed = (await client.get("/dashboard/decisions", params={"card_id": CARD})).json()
    assert listed[0]["reason"] == "second decision"
    assert listed[0]["snapshot"]["badges"] == {"reminders_nurse_call": "single_site"}


async def test_decision_log_is_append_only(client):
    for method in ("put", "patch", "delete"):
        r = await client.request(method.upper(), "/dashboard/decisions/anything")
        assert r.status_code in (404, 405)


async def test_unknown_county_is_404(client):
    assert (await client.get("/dashboard/counties/Atlantis")).status_code == 404
