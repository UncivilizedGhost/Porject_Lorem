"""Person 4. See .scratch/learn-sms-fhir-voice/spec.md -> Testing Decisions.

Pure: red-flag words fi/sv/en -> safety; no corpus hit -> no_source; the demo question retrieves
the bronchoscopy passage.
HTTP: "What is a bronchoscopy?" -> answer with source; model stubbed to fail -> passage verbatim
with source.
"""

import pytest

from app.services.learn import red_flags, retrieval


@pytest.mark.parametrize(
    ("text", "language"),
    [
        ("I am coughing blood", "en"),
        ("I have a fever", "en"),
        ("I can't breathe", "en"),
        ("Yskin verta", "fi"),
        ("Minulla on kuumetta", "fi"),
        ("En saa henkeä", "fi"),
        ("Jag har feber", "sv"),
        ("Jag hostar blod", "sv"),
    ],
)
def test_red_flag_words_are_detected_in_every_language(text, language):
    assert red_flags.contains_red_flag(text, language)


def test_ordinary_question_is_not_a_red_flag():
    assert not red_flags.contains_red_flag("What is a bronchoscopy?", "en")


def test_safety_message_names_the_emergency_numbers_and_the_38_rule():
    for language in ("fi", "sv", "en"):
        msg = red_flags.SAFETY_MESSAGE[language]
        assert "112" in msg and "116 117" in msg and "38" in msg


def test_demo_question_retrieves_the_bronchoscopy_passage():
    hits = retrieval.search("What is a bronchoscopy?", "en")
    assert hits and hits[0]["id"] == "bronchoscopy_en"
    assert hits[0]["text"] and hits[0]["url"]


def test_question_with_no_corpus_hit_returns_nothing():
    assert retrieval.search("What is the capital of Mongolia?", "en") == []


def test_retrieval_stays_in_the_questions_language():
    hits = retrieval.search("Mikä on bronkoskopia?", "fi")
    assert hits and all(h["language"] == "fi" for h in hits)
