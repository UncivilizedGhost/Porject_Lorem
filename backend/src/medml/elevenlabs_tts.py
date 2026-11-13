"""Tiny ElevenLabs text-to-speech example.

The SDK reads ``ELEVENLABS_API_KEY`` from the environment, which this module
loads from ``.env`` via python-dotenv. The key itself is never written into
code or committed: ``.env`` is gitignored.

third-party imports (``dotenv``, ``elevenlabs``) are lazy so this module can be
imported in the base environment without the ElevenLabs SDK installed; the SDK
is only required when you actually build a client or speak.
"""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # ElevenLabs default voice (Bella)
DEFAULT_MODEL = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"


def _load_env() -> None:
    """Load ``ELEVENLABS_API_KEY`` from ``.env`` into the environment."""
    from dotenv import load_dotenv  # lazy: optional dependency

    load_dotenv(".env")


@dataclass
class ElevenLabsTTS:
    """Thin wrapper around the ElevenLabs client for a hello-world TTS demo."""

    client: object
    voice_id: str = DEFAULT_VOICE_ID
    model_id: str = DEFAULT_MODEL

    @classmethod
    def from_env(cls) -> ElevenLabsTTS:
        """Build a client from ``ELEVENLABS_API_KEY`` in the environment."""
        _load_env()
        from elevenlabs import ElevenLabs  # lazy: optional dependency

        return cls(client=ElevenLabs())

    def list_voices(self) -> Iterator[str]:
        """Yield the IDs of the voices available to the account."""
        for voice in self.client.voices.get_all().voices:
            yield voice.voice_id

    def speak(self, text: str, output: str | Path = "hello_world.mp3") -> Path:
        """Convert ``text`` to speech and write it to ``output``.

        Returns the path to the written MP3. Does not play the audio.
        """
        output_path = Path(output)
        audio: Iterator[bytes] = self.client.text_to_speech.convert(
            voice_id=self.voice_id,
            text=text,
            model_id=self.model_id,
            output_format=OUTPUT_FORMAT,
        )
        with output_path.open("wb") as fh:
            for chunk in audio:
                fh.write(chunk)
        return output_path


def main() -> None:
    """CLI entry point: list voices, then speak a hello-world phrase to a file."""
    tts = ElevenLabsTTS.from_env()

    print("Available voices:")
    for voice_id in tts.list_voices():
        print(f"  - {voice_id}")

    output = tts.speak(
        "Hello world. This is a basic ElevenLabs text-to-speech test.",
        output="hello_world.mp3",
    )
    print(f"Wrote speech to {output}")


if __name__ == "__main__":
    main()
