"""Person 3, seam 2 (rules module, pure). See .scratch/coordinator-worklist/spec.md.

- two yellows → red
- any Safety Check item → red with call_now, even with no symptoms
- Own Words containing "blood" do not change a green grade
- fever boundaries on and off treatment (37,4 / 37,5 / 37,9 / 38,0 / 38,1 / 35,9)
- every option id in the catalogue maps to a grade
- stored rules_version equals RULES_VERSION
"""

import pytest

from app.rules import (
    RULES_VERSION,
    catalogue,
    grade_checkin,
    grade_symptom_report,
    grade_warning_sign,
)
from app.rules.catalogue import all_option_ids
from app.rules.grading import OPTION_GRADES


def report(symptoms=(), ticked=(), own_words=None):
    return {
        "safety_check": {"ticked": list(ticked)},
        "symptoms": list(symptoms),
        "own_words": own_words,
    }


def fever(temp, feeling="well"):
    return {"symptom": "fever_unwell", "answers": {"temperature": temp, "feeling": feeling}}


BREATHLESS_STAIRS = {
    "symptom": "breathlessness",
    "answers": {"new_or_worse": "yes", "when": "stairs", "getting_worse": "no"},
}


def test_a_single_yellow_symptom_is_yellow_with_nurse_review():
    r = grade_symptom_report(report([BREATHLESS_STAIRS]), "treatment")
    assert r["grade"] == "yellow"
    assert r["advice_shown"] == "nurse_review"
    assert r["per_symptom_grades"] == {"breathlessness": "yellow"}


def test_two_yellows_make_red_and_the_rule_says_so():
    r = grade_symptom_report(report([BREATHLESS_STAIRS, fever(37.6)]), "treatment")
    assert r["grade"] == "red"
    assert r["rule"] == "2 yellows (breathlessness, fever_unwell)"
    assert r["advice_shown"] == "call_now"


def test_any_safety_check_item_is_red_even_with_no_symptoms():
    r = grade_symptom_report(report(ticked=["chest_pain"]), "suspected_cancer")
    assert r["grade"] == "red"
    assert r["advice_shown"] == "call_now"
    assert r["rule"].startswith("Safety Check: ")


def test_own_words_never_change_a_green_grade():
    green = {"symptom": "pain", "answers": {"severity": "mild", "back_and_legs": "no"}}
    words = {"text": "I coughed blood and I cannot breathe", "source": "typed"}
    assert grade_symptom_report(report([green], own_words=words), "treatment")["grade"] == "green"


def test_own_words_never_lower_a_red_grade():
    words = {"text": "it is nothing, all fine", "source": "typed"}
    r = grade_symptom_report(report(ticked=["bleeding"], own_words=words), "treatment")
    assert r["grade"] == "red"


@pytest.mark.parametrize(
    "temp,phase,expected",
    [
        (37.4, "treatment", "green"),
        (37.5, "treatment", "yellow"),
        (37.9, "treatment", "yellow"),
        (38.0, "treatment", "red"),
        (38.1, "treatment", "red"),
        (35.9, "treatment", "red"),
        (37.4, "suspected_cancer", "green"),
        (37.5, "suspected_cancer", "yellow"),
        (38.0, "suspected_cancer", "yellow"),
        (38.1, "suspected_cancer", "yellow"),
    ],
)
def test_fever_boundaries_when_otherwise_well(temp, phase, expected):
    r = grade_symptom_report(report([fever(temp)]), phase)
    assert r["per_symptom_grades"]["fever_unwell"] == expected


def test_fever_above_38_with_feeling_unwell_is_red_off_treatment():
    r = grade_symptom_report(report([fever(38.1, "unwell")]), "suspected_cancer")
    assert r["grade"] == "red"


def test_feeling_unwell_without_fever_is_red_on_treatment():
    r = grade_symptom_report(report([fever(36.8, "unwell")]), "treatment")
    assert r["grade"] == "red"


def test_breathlessness_at_rest_is_red_and_no_change_is_green():
    at_rest = {"symptom": "breathlessness", "answers": {"new_or_worse": "yes", "when": "at_rest"}}
    assert grade_symptom_report(report([at_rest]), "treatment")["grade"] == "red"
    same = {"symptom": "breathlessness", "answers": {"new_or_worse": "no"}}
    assert grade_symptom_report(report([same]), "treatment")["grade"] == "green"


def test_something_else_grades_from_severity_interference_and_newness():
    mild = {"symptom": "other", "answers": {"severity": "mild", "interference": "a_little", "new_or_worse": "no"}}
    assert grade_symptom_report(report([mild]), "treatment")["grade"] == "green"
    bad = {"symptom": "other", "answers": {"severity": "severe", "interference": "a_little", "new_or_worse": "no"}}
    assert grade_symptom_report(report([bad]), "treatment")["grade"] == "red"
    new = {"symptom": "other", "answers": {"severity": "mild", "interference": "a_little", "new_or_worse": "yes"}}
    assert grade_symptom_report(report([new]), "treatment")["grade"] == "yellow"


def test_checkin_fever_during_treatment_is_red_call_now():
    r = grade_checkin({"temperature": 38.6}, "treatment")
    assert r["grade"] == "red"
    assert r["advice_shown"] == "call_now"
    assert "38,6" in r["rule"]


def test_checkin_red_flags_breathless_at_rest_and_coughing_blood():
    assert grade_checkin({"breathlessness": "at_rest"}, "treatment")["grade"] == "red"
    assert grade_checkin({"coughing_blood": "more_than_streaks"}, "treatment")["grade"] == "red"


def test_checkin_all_good_is_green_self_care():
    r = grade_checkin({"temperature": 36.8, "breathlessness": "none", "pain": "none"}, "treatment")
    assert (r["grade"], r["advice_shown"]) == ("green", "self_care")


def test_checkin_two_moderate_items_make_red():
    r = grade_checkin({"pain": "moderate", "fatigue": "moderate"}, "treatment")
    assert r["grade"] == "red"


def test_warning_sign_coughing_up_blood_is_red_and_any_other_is_yellow():
    assert grade_warning_sign("coughing_up_blood")["grade"] == "red"
    other = grade_warning_sign("hoarseness")
    assert other["grade"] == "yellow"
    assert grade_warning_sign("coughing_up_blood")["advice"] != other["advice"]


def test_every_catalogue_option_id_maps_to_a_grade():
    assert all_option_ids()
    for key in all_option_ids():
        assert OPTION_GRADES[key] in ("red", "yellow", "green"), key


def test_catalogue_sends_no_grade_maps_and_carries_the_version():
    cat = catalogue()
    assert cat["rules_version"] == RULES_VERSION
    assert len(cat["safety_check_items"]) == 7
    assert {s["id"] for s in cat["symptoms"]} == {
        "breathlessness",
        "cough",
        "pain",
        "fever_unwell",
        "tired_appetite",
    }
    assert "coughing_up_blood" in {w["id"] for w in cat["warning_signs"]}
    assert "grade" not in repr(cat).replace("grade_", "")  # no grade key anywhere


def test_graded_output_is_reproducible_from_answers():
    payload = report([BREATHLESS_STAIRS, fever(37.6)])
    assert grade_symptom_report(payload, "treatment") == grade_symptom_report(payload, "treatment")
