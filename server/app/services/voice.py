"""ElevenLabs text-to-speech / speech-to-text proxy with a disk cache (ADR-0005). Owner: person 4.

Reference for model and voice defaults: backend/src/medml/elevenlabs_tts.py (eleven_multilingual_v2)
— read it, do not import it. Talks to the ElevenLabs REST API over httpx, so no SDK is needed.
The key comes from config.elevenlabs_key() and goes only to ElevenLabs, never to a client or a log.
Pick Finnish and Swedish voices early and check pronunciation of bronkoskopia and keuhkosyöpä.
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

import httpx

from app import config

API_BASE = "https://api.elevenlabs.io/v1"
TTS_MODEL = "eleven_multilingual_v2"
STT_MODEL = "scribe_v1"
OUTPUT_FORMAT = "mp3_44100_128"
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # same default as backend/src/medml/elevenlabs_tts.py
SPEED = {"normal": 1.0, "slow": 0.8}
UPSTREAM_TIMEOUT_S = 20.0

# Override per language with VOICE_ID_FI / VOICE_ID_SV / VOICE_ID_EN once voices are chosen.
VOICES: dict[str, str] = {
    lang: os.getenv(f"VOICE_ID_{lang.upper()}", DEFAULT_VOICE_ID) for lang in ("fi", "sv", "en")
}

# Tests inject an httpx.MockTransport here; None means the real network.
_transport: httpx.AsyncBaseTransport | None = None


class VoiceUnavailable(Exception):
    """No key, or ElevenLabs failed. Callers answer 503 so the browser can fall back."""


def startup_warning() -> str | None:
    if config.elevenlabs_key():
        return None
    return (
        "[startup] ELEVENLABS key missing (.secrets/elevenlabs_key or ELEVENLABS_KEY): "
        "/voice/tts answers 503 fallback=browser and /voice/stt answers 503."
    )


def cache_path(text: str, language: str, voice: str, speed: str) -> Path:
    key = hashlib.sha256(f"{text}|{language}|{voice}|{speed}".encode()).hexdigest()
    return config.VOICE_CACHE_DIR / f"{key}.mp3"


def _key() -> str:
    key = config.elevenlabs_key()
    if not key:
        raise VoiceUnavailable("no ElevenLabs key")
    return key


async def tts(text: str, language: str, speed: str = "normal") -> bytes:
    voice = VOICES.get(language, DEFAULT_VOICE_ID)
    path = cache_path(text, language, voice, speed)
    if path.is_file():
        return path.read_bytes()
    key = _key()
    payload = {
        "text": text,
        "model_id": TTS_MODEL,
        "voice_settings": {"speed": SPEED.get(speed, 1.0)},
    }
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT_S, transport=_transport) as http:
            response = await http.post(
                f"{API_BASE}/text-to-speech/{voice}",
                params={"output_format": OUTPUT_FORMAT},
                json=payload,
                headers={"xi-api-key": key},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise VoiceUnavailable(type(exc).__name__) from exc
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(response.content)
    return response.content


async def stt(audio: bytes, language: str) -> str:
    """Returns the transcript. Audio is never written to disk."""
    key = _key()
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT_S, transport=_transport) as http:
            response = await http.post(
                f"{API_BASE}/speech-to-text",
                data={"model_id": STT_MODEL, "language_code": language},
                files={"file": ("speech.webm", audio, "application/octet-stream")},
                headers={"xi-api-key": key},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise VoiceUnavailable(type(exc).__name__) from exc
    return str(response.json().get("text", "")).strip()
