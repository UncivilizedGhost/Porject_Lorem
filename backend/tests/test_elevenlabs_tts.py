"""Tests for the ElevenLabs hello-world TTS module.

Hermetic: the ElevenLabs client is stubbed so no network call or speech
synthesis happens. These tests are skipped when the ``elevenlabs``/``python-dotenv``
packages are not installed (e.g. the base environment).
"""

from __future__ import annotations

from pathlib import Path
from unittest import mock

import pytest

from medml.elevenlabs_tts import DEFAULT_MODEL, DEFAULT_VOICE_ID, ElevenLabsTTS

pytest.importorskip("dotenv")
pytest.importorskip("elevenlabs")


def test_defaults() -> None:
    assert DEFAULT_VOICE_ID == "EXAVITQu4vr4xnSDxMaL"
    assert DEFAULT_MODEL == "eleven_multilingual_v2"


def test_from_env_builds_client(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key-1234")
    tts = ElevenLabsTTS.from_env()
    assert isinstance(tts.client, object)
    assert tts.voice_id == DEFAULT_VOICE_ID
    assert tts.model_id == DEFAULT_MODEL


def test_speak_writes_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key-1234")
    tts = ElevenLabsTTS.from_env()

    # Stub text_to_speech.convert to return fake audio chunks instead of calling
    # the ElevenLabs API (no speech, no network).
    fake_audio = [b"chunk-1", b"chunk-2"]
    convert_mock = mock.Mock(return_value=iter(fake_audio))
    tts.client.text_to_speech.convert = convert_mock  # type: ignore[method-assign]

    out = tmp_path / "hello_world.mp3"
    result = tts.speak("Hello world.", output=out)

    assert result == out
    assert out.read_bytes() == b"".join(fake_audio)
    convert_mock.assert_called_once()
    kwargs = convert_mock.call_args.kwargs
    assert kwargs["text"] == "Hello world."
    assert kwargs["voice_id"] == DEFAULT_VOICE_ID
    assert kwargs["model_id"] == DEFAULT_MODEL
