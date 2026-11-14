"""Person 4. Stub ElevenLabs like backend/tests/test_elevenlabs_tts.py (unittest.mock, tmp_path).

- /voice/tts returns cached audio on the second call without calling ElevenLabs again
- /voice/tts returns 503 with fallback when the key is missing
- /voice/stt returns the stubbed transcript and stores no audio
"""
