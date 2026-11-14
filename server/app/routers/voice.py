"""ElevenLabs proxy (ADR-0005). Owner: person 4. Client + disk cache in `app/services/voice.py`.
The browser never talks to ElevenLabs; the key stays in `.secrets/elevenlabs_key`.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/tts")
async def tts():
    """Body { text, language, speed } → audio/mpeg, cached by hash(text, language, voice, speed). Missing key → 503 { fallback: 'browser' }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/stt")
async def stt():
    """multipart audio + language → { transcript }. Audio is never stored. Missing key → 503."""
    raise HTTPException(status_code=501, detail="not implemented")
