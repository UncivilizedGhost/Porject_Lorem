"""Person 3, seam 1 (HTTP): grading endpoints and what then appears on GET /worklist."""

import pytest
from test_core_api import make_contact

pytestmark = pytest.mark.usefixtures("fresh_db")

FEVER = {"temperature": 38.6}


async def make_treatment_patient(client) -> str:
    cid = await make_contact(client)
    pid = (await client.post(f"/contacts/{cid}/promote")).json()["patient_id"]
    r = await client.post("/demo/start-treatment", json={"patient_id": pid})
    assert r.status_code == 200, r.text
    return pid


async def rows(client):
    r = await client.get("/worklist", params={"coordinator_id": "coordinator-aino"})
    assert r.status_code == 200, r.text
    return r.json()["rows"]


async def test_checkin_with_fever_during_treatment_is_a_red_call_now_row(client):
    pid = await make_treatment_patient(client)
    r = await client.post(f"/patients/{pid}/checkin", json={"answers": FEVER, "actor": "self", "input": "touch"})
    assert r.json() == {"grade": "red", "advice_shown": "call_now"}

    [row] = await rows(client)
    assert (row["kind"], row["band"], row["level"]) == ("alert", 1, "red")
    assert row["label"] == "Call now"
    assert "38,6" in row["reason"]
    assert row["person"]["subject_id"] == pid
    assert row["acknowledged"] is False
    assert row["pathway_clock"]["target_days"] == 42


async def test_green_checkin_leaves_the_worklist_empty(client):
    pid = await make_treatment_patient(client)
    r = await client.post(
        f"/patients/{pid}/checkin", json={"answers": {"temperature": 36.8, "pain": "none"}, "actor": "self"}
    )
    assert r.json()["grade"] == "green"
    assert await rows(client) == []


async def test_trusted_person_checkin_grades_the_same_and_says_reported_by(client):
    pid = await make_treatment_patient(client)
    r = await client.post(
        f"/patients/{pid}/checkin",
        json={"answers": FEVER, "actor": "trusted_person", "trusted_person_name": "Liisa K.", "input": "voice"},
    )
    assert r.json()["grade"] == "red"
    [row] = await rows(client)
    assert row["reported_by"] == {"actor": "trusted_person", "name": "Liisa K."}


async def test_server_ignores_client_sent_grade_rule_and_advice(client):
    pid = await make_treatment_patient(client)
    r = await client.post(
        f"/patients/{pid}/checkin",
        json={"answers": FEVER, "actor": "self", "grade": "green", "rule": "x", "advice_shown": "self_care"},
    )
    assert r.json() == {"grade": "red", "advice_shown": "call_now"}


async def test_checkin_with_an_unknown_option_is_rejected(client):
    pid = await make_treatment_patient(client)
    r = await client.post(f"/patients/{pid}/checkin", json={"answers": {"pain": "enormous"}, "actor": "self"})
    assert r.status_code == 422


STAIRS = {
    "symptom": "breathlessness",
    "answers": {"new_or_worse": "yes", "when": "stairs", "getting_worse": "no"},
}


async def test_symptom_report_returns_server_computed_grade_and_rule(client):
    pid = await make_treatment_patient(client)
    body = {
        "safety_check": {"ticked": []},
        "symptoms": [{**STAIRS, "grade": "green"}],
        "own_words": {"text": "I get out of breath on the stairs", "source": "typed"},
        "actor": "self",
        "grade": "green",
    }
    r = await client.post(f"/patients/{pid}/symptom-report", json=body)
    out = r.json()
    assert out["grade"] == "yellow"
    assert out["advice_shown"] == "nurse_review"
    assert out["rule"]
    [row] = await rows(client)
    assert (row["band"], row["level"]) == (4, "yellow")


async def test_second_report_on_the_same_symptom_appends_to_the_open_alert(client):
    pid = await make_treatment_patient(client)
    body = {"safety_check": {"ticked": []}, "symptoms": [STAIRS], "own_words": None, "actor": "self"}
    await client.post(f"/patients/{pid}/symptom-report", json=body)
    await client.post(f"/patients/{pid}/symptom-report", json=body)
    [row] = await rows(client)
    alert = (await client.get(f"/alerts/{row['detail_ref']}")).json()
    assert len(alert["trigger_event_ids"]) == 2


async def test_alert_card_shows_own_words_verbatim_with_source_and_rules_version(client):
    pid = await make_treatment_patient(client)
    words = {"text": "yskin verta eilen", "source": "voice"}
    body = {"safety_check": {"ticked": []}, "symptoms": [STAIRS], "own_words": words, "actor": "self"}
    await client.post(f"/patients/{pid}/symptom-report", json=body)
    [row] = await rows(client)
    card = (await client.get(f"/alerts/{row['detail_ref']}")).json()
    [report] = card["reports"]
    assert report["own_words"] == words
    assert report["rules_version"]
    assert report["advice_shown"] == "nurse_review"
    assert report["symptoms"][0]["symptom"] == "breathlessness"


async def test_safety_check_report_is_red_with_call_now(client):
    pid = await make_treatment_patient(client)
    body = {"safety_check": {"ticked": ["chest_pain"]}, "symptoms": [], "own_words": None, "actor": "self"}
    out = (await client.post(f"/patients/{pid}/symptom-report", json=body)).json()
    assert (out["grade"], out["advice_shown"]) == ("red", "call_now")
    [row] = await rows(client)
    assert row["band"] == 1


async def test_coughing_up_blood_tap_is_a_red_row_not_a_callback(client):
    cid = await make_contact(client)
    out = (await client.post(f"/contacts/{cid}/warning-sign-tap", json={"symptom": "coughing_up_blood"})).json()
    assert out["grade"] == "red"
    [row] = await rows(client)
    assert (row["kind"], row["band"], row["level"]) == ("alert", 1, "red")
    assert row["person"]["subject_type"] == "contact"
    assert row["pathway_clock"] is None


async def test_other_warning_sign_becomes_a_callback_row_without_pathway_clock(client):
    cid = await make_contact(client)
    out = (await client.post(f"/contacts/{cid}/warning-sign-tap", json={"symptom": "hoarseness"})).json()
    assert out["grade"] == "yellow"
    [row] = await rows(client)
    assert (row["kind"], row["band"]) == ("callback", 2)
    assert row["pathway_clock"] is None
    assert "Hoarse" in row["reason"]
    assert "flag_referral" in row["actions"]


async def test_flag_referral_moves_the_callback_row_out_of_band_two(client):
    cid = await make_contact(client)
    await client.post(f"/contacts/{cid}/warning-sign-tap", json={"symptom": "hoarseness"})
    await client.post(f"/contacts/{cid}/promote")
    assert [r for r in await rows(client) if r["kind"] == "callback"] == []


async def test_callback_handled_drops_the_row(client):
    cid = await make_contact(client)
    await client.post(f"/contacts/{cid}/warning-sign-tap", json={"symptom": "hoarseness"})
    r = await client.post(f"/contacts/{cid}/callback-handled")
    assert r.status_code == 200
    assert await rows(client) == []


async def test_acknowledge_is_idempotent_and_the_row_stays_until_mark_done(client):
    pid = await make_treatment_patient(client)
    await client.post(f"/patients/{pid}/checkin", json={"answers": FEVER, "actor": "self"})
    [row] = await rows(client)
    alert_id = row["detail_ref"]

    first = await client.post(f"/alerts/{alert_id}/acknowledge", json={"coordinator_id": "coordinator-aino"})
    second = await client.post(f"/alerts/{alert_id}/acknowledge", json={"coordinator_id": "coordinator-aino"})
    assert first.status_code == second.status_code == 200
    assert first.json()["acknowledged_at"] == second.json()["acknowledged_at"]

    [row] = await rows(client)
    assert row["acknowledged"] is True

    await client.post(f"/alerts/{alert_id}/actions", json={"action": "mark_done", "note": "false alarm"})
    assert await rows(client) == []


async def test_actions_are_recorded_on_the_alert(client):
    pid = await make_treatment_patient(client)
    await client.post(f"/patients/{pid}/checkin", json={"answers": FEVER, "actor": "self"})
    alert_id = (await rows(client))[0]["detail_ref"]
    await client.post(f"/alerts/{alert_id}/actions", json={"action": "assign_to_me"})
    await client.post(f"/alerts/{alert_id}/actions", json={"action": "record_action", "note": "called, ED advised"})
    alert = (await client.get(f"/alerts/{alert_id}")).json()
    assert [a["action"] for a in alert["actions_taken"]] == ["assign_to_me", "record_action"]
    assert alert["actions_taken"][1]["note"] == "called, ED advised"


async def test_rows_are_ordered_by_band_then_oldest_first(client):
    pid = await make_treatment_patient(client)
    yellow_contact = await make_contact(client)
    await client.post(f"/contacts/{yellow_contact}/warning-sign-tap", json={"symptom": "hoarseness"})
    await client.post(
        f"/patients/{pid}/symptom-report",
        json={"safety_check": {"ticked": []}, "symptoms": [STAIRS], "own_words": None, "actor": "self"},
    )
    await client.post(f"/patients/{pid}/checkin", json={"answers": FEVER, "actor": "self"})
    assert [r["band"] for r in await rows(client)] == [1, 2, 4]


async def test_unconfirmed_escalation_climbs_the_ladder_on_the_worklist(client):
    cid = await make_contact(client)
    await client.post(f"/contacts/{cid}/promote")
    assert await rows(client) == []
    for _ in range(3):
        await client.post("/demo/advance-day")
    [row] = await rows(client)
    assert (row["kind"], row["band"]) == ("escalation", 3)
    assert row["level"] is None
    assert row["pathway_clock"]["day"] == 3
    assert "mark_handled" in row["actions"]
    assert "nurse" in row["reason"].lower()


async def test_confirmation_removes_the_escalation_row(client):
    cid = await make_contact(client)
    pid = (await client.post(f"/contacts/{cid}/promote")).json()["patient_id"]
    await client.post("/demo/advance-day")
    [row] = await rows(client)
    step_id = (await client.get(f"/patients/{pid}")).json()["next_step"]["pending_confirmation"]["id"]
    await client.post(f"/escalation-steps/{step_id}/confirm", json={"actor": "self"})
    assert await rows(client) == []


async def test_escalation_mark_handled_drops_the_row_until_the_next_rung(client):
    cid = await make_contact(client)
    await client.post(f"/contacts/{cid}/promote")
    await client.post("/demo/advance-day")
    [row] = await rows(client)
    r = await client.post(f"/escalation-steps/{row['detail_ref']}/handled")
    assert r.status_code == 200
    assert await rows(client) == []
    await client.post("/demo/advance-day")  # rung 1 fires on day 2
    assert len(await rows(client)) == 1


async def test_two_skipped_doses_without_a_taken_raise_a_yellow_alert(client):
    pid = await make_treatment_patient(client)
    log = {"medicine_id": "med_morning", "actor": "self", "input": "touch"}
    await client.post(f"/patients/{pid}/medication-log", json={**log, "status": "skipped"})
    assert await rows(client) == []
    await client.post(f"/patients/{pid}/medication-log", json={**log, "status": "skipped"})
    [row] = await rows(client)
    assert (row["band"], row["level"]) == (4, "yellow")


async def test_a_taken_dose_resets_the_missed_dose_count(client):
    pid = await make_treatment_patient(client)
    log = {"medicine_id": "med_morning", "actor": "self", "input": "touch"}
    await client.post(f"/patients/{pid}/medication-log", json={**log, "status": "skipped"})
    await client.post(f"/patients/{pid}/medication-log", json={**log, "status": "taken"})
    await client.post(f"/patients/{pid}/medication-log", json={**log, "status": "skipped"})
    assert await rows(client) == []


async def test_workload_line_counts_todays_alerts_and_false_alarms(client):
    pid = await make_treatment_patient(client)
    await client.post(f"/patients/{pid}/checkin", json={"answers": FEVER, "actor": "self"})
    alert_id = (await rows(client))[0]["detail_ref"]
    await client.post(f"/alerts/{alert_id}/actions", json={"action": "mark_done", "note": "false alarm"})
    work = (await client.get("/worklist", params={"coordinator_id": "coordinator-aino"})).json()["workload"]
    assert work == {"alerts_today": 1, "false_alarm_share": 1.0}


async def test_identities_follow_the_latest_patient(client):
    pid = await make_treatment_patient(client)
    ids = (await client.get("/demo/identities")).json()
    assert ids["patient_id"] == pid
    assert ids["trusted_person"]["name"] == "Liisa K."
