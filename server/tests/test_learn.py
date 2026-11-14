"""Person 4. See .scratch/learn-sms-fhir-voice/spec.md -> Testing Decisions.

Pure: red-flag words fi/sv/en -> safety; no corpus hit -> no_source; the demo question retrieves
the bronchoscopy passage.
HTTP: "What is a bronchoscopy?" -> answer with source; model stubbed to fail -> passage verbatim
with source.
"""

import asyncio

import pytest

from app.services import nemotron
from app.services.learn import red_flags, retrieval


@pytest.fixture
def model(monkeypatch):
    """Stub Nemotron: records prompts, returns a canned rephrasing. Never calls the network."""
    calls: list[tuple[str, str]] = []

    async def fake_complete(system, user, *, timeout_s=None):
        calls.append((system, user))
        return "A bronchoscopy looks at your airways with a thin camera."

    monkeypatch.setattr(nemotron, "complete", fake_complete)
    return calls


@pytest.fixture
def model_down(monkeypatch):
    async def failing(system, user, *, timeout_s=None):
        raise TimeoutError("model down")

    monkeypatch.setattr(nemotron, "complete", failing)


async def test_ask_demo_question_returns_rephrased_answer_with_source(client, model):
    r = await client.post("/learn/ask", json={"question": "What is a bronchoscopy?", "language": "en"})
    body = r.json()
    assert r.status_code == 200
    assert body["kind"] == "answer"
    assert body["text"] == "A bronchoscopy looks at your airways with a thin camera."
    assert body["sources"][0]["passage_id"] == "bronchoscopy_en"
    assert body["sources"][0]["label"] and body["sources"][0]["url"]


async def test_model_is_asked_to_use_only_the_retrieved_passage_and_avoid_advice(client, model):
    await client.post("/learn/ask", json={"question": "What is a bronchoscopy?", "language": "en"})
    system, user = model[0]
    assert "only" in system.lower() and "diagnos" in system.lower() and "dos" in system.lower()
    assert "thin, flexible tube" in user  # the retrieved passage text is what the model sees


async def test_model_failure_returns_best_passage_verbatim_with_source(client, model_down):
    r = await client.post("/learn/ask", json={"question": "What is a bronchoscopy?", "language": "en"})
    body = r.json()
    assert body["kind"] == "answer"
    assert body["text"].startswith("A bronchoscopy is an examination of your airways")
    assert body["sources"][0]["passage_id"] == "bronchoscopy_en"


async def test_slow_model_times_out_to_the_passage(client, monkeypatch):
    async def slow(system, user, *, timeout_s=None):
        await asyncio.sleep(5)
        return "too late"

    monkeypatch.setattr(nemotron, "complete", slow)
    monkeypatch.setattr("app.config.NEMOTRON_TIMEOUT_S", 0.05)
    r = await client.post("/learn/ask", json={"question": "What is a CT scan?", "language": "en"})
    assert r.json()["text"].startswith("A CT scan, or computed tomography")


async def test_red_flag_question_gets_fixed_safety_message_and_never_the_model(client, model):
    r = await client.post("/learn/ask", json={"question": "I'm coughing blood", "language": "en"})
    body = r.json()
    assert body["kind"] == "safety"
    assert body["text"] == red_flags.SAFETY_MESSAGE["en"]
    assert body["sources"] == []
    assert model == []


async def test_question_without_a_source_says_ask_your_nurse_with_the_number(client, model):
    r = await client.post("/learn/ask", json={"question": "What is the capital of Mongolia?", "language": "en"})
    body = r.json()
    assert body["kind"] == "no_source"
    assert "nurse" in body["text"].lower()
    assert body["sources"] == []
    assert model == []


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


@pytest.mark.parametrize(
    ("question", "language", "passage_id"),
    [
        ("What is a CT scan?", "en", "ct_en"),
        ("Can Kela pay for my taxi?", "en", "kela_travel_en"),
        ("What is the 6 week goal?", "en", "six_week_goal_en"),
        ("Mikä on keuhkokuva?", "fi", "xray_fi"),
        ("Vad är en bronkoskopi?", "sv", "bronchoscopy_sv"),
    ],
)
def test_core_topics_retrieve_their_passage_first(question, language, passage_id):
    hits = retrieval.search(question, language)
    assert hits and hits[0]["id"] == passage_id


def test_retrieval_stays_in_the_questions_language():
    hits = retrieval.search("Mikä on bronkoskopia?", "fi")
    assert hits and all(h["language"] == "fi" for h in hits)
