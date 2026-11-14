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
