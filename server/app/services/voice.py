"""ElevenLabs text-to-speech / speech-to-text proxy with a disk cache (ADR-0005). Owner: person 4.

Reference for model and voice defaults: backend/src/medml/elevenlabs_tts.py (eleven_multilingual_v2)
— read it, do not import it. Pick Finnish and Swedish voices early and check pronunciation of
bronkoskopia and keuhkosyöpä.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from app import config

VOICES: dict[str, str] = {"fi": "", "sv": "", "en": ""}  # TODO: voice ids per language


def cache_path(text: str, language: str, voice: str, speed: str) -> Path:
    key = hashlib.sha256(f"{text}|{language}|{voice}|{speed}".encode()).hexdigest()
    return config.VOICE_CACHE_DIR / f"{key}.mp3"


async def tts(text: str, language: str, speed: str = "normal") -> bytes:
    raise NotImplementedError


async def stt(audio: bytes, language: str) -> str:
    """Returns the transcript. Audio is never written to disk."""
    raise NotImplementedError
