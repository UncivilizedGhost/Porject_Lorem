"""Person 4. ElevenLabs is stubbed with an httpx.MockTransport (same hermetic idea as
backend/tests/test_elevenlabs_tts.py); cache and audio go under tmp_path. No network, no real key.

- /voice/tts returns cached audio on the second call without calling ElevenLabs again
- /voice/tts returns 503 with fallback when the key is missing
- /voice/stt returns the stubbed transcript and stores no audio
"""

import httpx
import pytest

from app import config
from app.services import voice

FAKE_KEY = "test-key-not-real"


class FakeElevenLabs:
    def __init__(self):
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if "/text-to-speech/" in request.url.path:
            return httpx.Response(200, content=b"ID3-fake-mp3", headers={"content-type": "audio/mpeg"})
        if request.url.path.endswith("/speech-to-text"):
            return httpx.Response(200, json={"text": "kyllä"})
        return httpx.Response(404)


@pytest.fixture
def eleven(monkeypatch, tmp_path):
    fake = FakeElevenLabs()
    monkeypatch.setattr(voice, "_transport", httpx.MockTransport(fake))
    monkeypatch.setattr(config, "VOICE_CACHE_DIR", tmp_path / "cache")
    monkeypatch.setattr(config, "elevenlabs_key", lambda: FAKE_KEY)
    return fake


@pytest.fixture
def no_key(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "VOICE_CACHE_DIR", tmp_path / "cache")
    monkeypatch.setattr(config, "elevenlabs_key", lambda: None)


async def test_tts_returns_audio_and_sends_the_key_only_to_elevenlabs(client, eleven):
    r = await client.post("/voice/tts", json={"text": "Hei", "language": "fi", "speed": "normal"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "audio/mpeg"
    assert r.content == b"ID3-fake-mp3"
    assert eleven.requests[0].headers["xi-api-key"] == FAKE_KEY
    assert FAKE_KEY.encode() not in r.content and FAKE_KEY not in str(r.headers)


async def test_second_identical_tts_call_is_served_from_the_cache(client, eleven):
    body = {"text": "Mikä on bronkoskopia?", "language": "fi", "speed": "normal"}
    first = await client.post("/voice/tts", json=body)
    second = await client.post("/voice/tts", json=body)
    assert first.content == second.content == b"ID3-fake-mp3"
    assert len(eleven.requests) == 1


async def test_cache_is_keyed_by_text_language_and_speed(client, eleven):
    await client.post("/voice/tts", json={"text": "Hei", "language": "fi", "speed": "normal"})
    await client.post("/voice/tts", json={"text": "Hei", "language": "fi", "speed": "slow"})
    await client.post("/voice/tts", json={"text": "Hei", "language": "sv", "speed": "normal"})
    assert len(eleven.requests) == 3


async def test_slow_speed_is_sent_to_elevenlabs_as_a_lower_speed(client, eleven):
    await client.post("/voice/tts", json={"text": "Hei", "language": "en", "speed": "slow"})
    import json

    settings = json.loads(eleven.requests[0].content)["voice_settings"]
    assert settings["speed"] < 1.0


async def test_tts_without_a_key_is_503_with_browser_fallback(client, no_key):
    r = await client.post("/voice/tts", json={"text": "Hei", "language": "fi", "speed": "normal"})
    assert r.status_code == 503
    assert r.json()["fallback"] == "browser"


async def test_tts_upstream_failure_is_503_with_browser_fallback(client, monkeypatch, tmp_path):
    monkeypatch.setattr(config, "VOICE_CACHE_DIR", tmp_path / "cache")
    monkeypatch.setattr(config, "elevenlabs_key", lambda: FAKE_KEY)
    monkeypatch.setattr(voice, "_transport", httpx.MockTransport(lambda r: httpx.Response(500)))
    r = await client.post("/voice/tts", json={"text": "Hei", "language": "fi", "speed": "normal"})
    assert r.status_code == 503 and r.json()["fallback"] == "browser"


async def test_stt_returns_the_transcript_and_stores_no_audio(client, eleven, tmp_path):
    files = {"audio": ("clip.webm", b"RIFF-fake-audio", "audio/webm")}
    r = await client.post("/voice/stt", files=files, data={"language": "fi"})
    assert r.status_code == 200
    assert r.json() == {"transcript": "kyllä"}
    assert b"RIFF-fake-audio" in eleven.requests[0].content  # went to the provider...
    assert not any(p.is_file() for p in tmp_path.rglob("*"))  # ...and nowhere on disk


async def test_stt_without_a_key_is_503(client, no_key):
    files = {"audio": ("clip.webm", b"x", "audio/webm")}
    r = await client.post("/voice/stt", files=files, data={"language": "fi"})
    assert r.status_code == 503


def test_startup_warning_is_loud_when_the_key_is_missing(monkeypatch):
    monkeypatch.setattr(config, "elevenlabs_key", lambda: None)
    assert "ELEVENLABS" in voice.startup_warning().upper()
    monkeypatch.setattr(config, "elevenlabs_key", lambda: FAKE_KEY)
    assert voice.startup_warning() is None
