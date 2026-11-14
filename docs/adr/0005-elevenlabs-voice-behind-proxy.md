# ElevenLabs for Read-aloud and Voice Mode, behind a server proxy, limited to on-screen actions

**Status:** accepted

Read-aloud (text-to-speech) and Voice Mode (speech-to-text) use ElevenLabs, which gives Finnish, Swedish and English voices from one vendor and is quick to integrate in an 8-hour build. The browser only calls our own `POST /voice/tts` and `POST /voice/stt`; the server holds the key (`.secrets/elevenlabs_key`). Voice Mode is deliberately narrow: the transcript is matched by plain string rules against the labels of the actions already on the current screen, plus a few fixed words (yes, no, repeat, back, help), and every matched action is read back and confirmed with a spoken "yes" before it is sent. We rejected ElevenLabs' conversational agent product, where a language model runs the dialogue and decides what the person meant, because the plan keeps AI to explaining, never deciding (plan section 6), and symptom grading must stay rule-based. A model choosing which Check-in answer a patient meant would blur both.

**Consequences:**

- Every companion screen must expose its actions as labelled controls with visible text, which WCAG 2.1 AA needs anyway. A gesture-only control (the slide-to-confirm) needs a button and a voice equivalent.
- Read-aloud sits alongside the device's own screen reader and never replaces it.
- ElevenLabs is not an EU-hosted processor by default, and plan section 6 requires EU hosting for health data. The demo sends only demo identities' text and audio. Before any real patient data, confirm whether ElevenLabs' EU data-residency and zero-retention terms cover this use, or swap vendors. Because of the proxy, either is a server-only change.
- Voice-submitted events carry `input: "voice"`. Audio is not stored.
