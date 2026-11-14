"""ElevenLabs proxy (ADR-0005). Owner: person 4. Client + disk cache in `app/services/voice.py`.
The browser never talks to ElevenLabs; the key stays in `.secrets/elevenlabs_key`.
"""

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from app.services import voice

router = APIRouter(prefix="/voice", tags=["voice"])


class TtsBody(BaseModel):
    text: str
    language: str = "en"
    speed: str = "normal"


@router.post("/tts")
async def tts(body: TtsBody):
    """Body { text, language, speed } → audio/mpeg, cached by hash(text, language, voice, speed). Missing key → 503 { fallback: 'browser' }."""
    try:
        audio = await voice.tts(body.text, body.language, body.speed)
    except voice.VoiceUnavailable:
        return JSONResponse(status_code=503, content={"fallback": "browser"})
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/stt")
async def stt(audio: UploadFile = File(...), language: str = Form("en")):
    """multipart audio + language → { transcript }. Audio is never stored. Missing key → 503."""
    data = await audio.read()
    try:
        transcript = await voice.stt(data, language)
    except voice.VoiceUnavailable:
        return JSONResponse(status_code=503, content={"detail": "speech-to-text unavailable"})
    return {"transcript": transcript}
