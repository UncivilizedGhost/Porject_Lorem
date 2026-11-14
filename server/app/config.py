"""Runtime configuration.

Everything comes from environment variables (see `.env.example` at the repo root) or from
files under `.secrets/` (never committed). No Atlas-specific code: swap `MONGODB_URI` to move
to Atlas (ADR-0001).
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pathway")
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
).split(",")

# Nemotron (Learn + dashboard summary). Shared client in services/nemotron.py.
NEMOTRON_BASE_URL: str = os.getenv("NEMOTRON_BASE_URL", "")
NEMOTRON_MODEL: str = os.getenv("NEMOTRON_MODEL", "")
NEMOTRON_TIMEOUT_S: float = float(os.getenv("NEMOTRON_TIMEOUT_S", "8"))

# ElevenLabs (voice proxy, ADR-0005). TTS disk cache location.
VOICE_CACHE_DIR: Path = Path(os.getenv("VOICE_CACHE_DIR", REPO_ROOT / "server" / ".cache" / "voice"))

SECRETS_DIR: Path = REPO_ROOT / ".secrets"


def read_secret(name: str) -> str | None:
    """Return the contents of `.secrets/<name>` (key only, no newline) or None if missing."""
    path = SECRETS_DIR / name
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8").strip() or None


def nemotron_key() -> str | None:
    return read_secret("verda_inference_key")


def elevenlabs_key() -> str | None:
    return read_secret("elevenlabs_key")
