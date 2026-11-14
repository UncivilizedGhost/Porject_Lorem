"""Runtime configuration.

Everything comes from environment variables (see `.env.example` at the repo root) or from
files under `.secrets/` (never committed). No Aiven-specific code: swap `DATABASE_URL` to move
from the local Postgres to the Aiven service (ADR-0007).
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

# Local: server/compose.yaml. Aiven: the service URI from the console (keeps `?sslmode=require`).
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pathway:pathway@localhost:5432/pathway")
# Tests point this at a throwaway schema; everything else uses "public".
DB_SCHEMA: str = os.getenv("PATHWAY_DB_SCHEMA", "public")
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
    """Return the contents of `.secrets/<name>` (key only, no newline), else the env var of the
    same name upper-cased (hosted deployments have no `.secrets/`), else None."""
    path = SECRETS_DIR / name
    if path.is_file():
        return path.read_text(encoding="utf-8").strip() or None
    return os.getenv(name.upper()) or None


def nemotron_key() -> str | None:
    return read_secret("verda_inference_key")


def elevenlabs_key() -> str | None:
    return read_secret("elevenlabs_key")
