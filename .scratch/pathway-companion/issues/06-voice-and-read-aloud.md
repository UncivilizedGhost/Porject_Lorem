Status: ready-for-human

# Voice Mode and Read-aloud (ElevenLabs)

Owner: person 4 after issue 05 (server proxy and the voice layer); person 2 registers each companion screen's actions. Covers the plan's onboarding "voice" setting (section 4.3) and the accessibility row of section 6. Decision record: ADR-0005.

Every companion interaction can be done by voice for people who need it, and every companion screen can be read aloud for people with low vision. Applies to Contacts, Patients and Trusted People alike. The Worklist and Dashboard are out of scope.

## Tasks

1. `POST /voice/tts` `{ text, language }` → audio. Calls ElevenLabs text-to-speech with a multilingual model (Finnish, Swedish, English). Cache results by hash of (text, language, voice) on disk, so repeated screens don't re-bill and play instantly during the demo.
2. `POST /voice/stt` short recording (browser `MediaRecorder` output) → `{ transcript }`. Calls ElevenLabs speech-to-text with the person's language as a hint.
3. Key in `.secrets/elevenlabs_key`, read the same way as the Nemotron key. Never in the frontend bundle. If the key is missing, log it loudly at startup and let Read-aloud fall back to the browser's `speechSynthesis`, so the demo survives a network failure.
4. Read-aloud: when switched on, each screen reads its heading and main content on arrival. A "Read this page" control is on every screen whether or not Read-aloud is on. Red "Call now" and fixed safety messages are always read first. Two speeds: normal and slow.
5. Voice Mode: a hold-to-talk microphone button (at least 56 px) above the bottom nav, never always-listening. Each screen registers its actions as `{ label, synonyms, run }`. The transcript is matched by normalised string rules against the current screen's actions plus global words (yes, no, repeat, back, help, call my nurse). No language model interprets it (ADR-0005). On a match, read the action back ("Confirm the chest CT on Tuesday at 9:30? Say yes or no.") and run it only after "yes". With no match, say "I didn't catch that. You can say:" and list the screen's actions.
6. Cover every companion interaction:
   - Risk check answers, numbers included.
   - Warning-sign "I have this".
   - Confirmation: voice replaces the slide.
   - Check-in: read each PRO-CTCAE item with its options and accept the spoken option. The temperature is spoken as a number.
   - Medication: taken, skipped or side effect.
   - Learn: the transcript fills the question box, and the answer is read aloud with its source.
   - Trusted Person: confirmation, Check-in and Symptom Report.
   - Symptom Report: Safety Check items and "none of these", symptom choice and each guided answer are matched like any other on-screen action. Own Words is the one dictation field: the transcript is stored as text after it is read back and the person says "yes" (ADR-0006). No matching or interpretation is applied to it.
7. Red-flag words in a spoken Check-in answer or in spoken Own Words (fever, blood, can't breathe) trigger the same fixed safety message as on screen, read aloud at once. Grading itself stays in issue 04's rule engine; the safety message never lowers or sets a grade.
8. Set `input: "voice"` on every event submitted through Voice Mode.
9. Toggles live in onboarding and settings (issue 03 task 11). The "Aa" button in each screen's header opens them.

## Acceptance

- With Voice Mode on, the demo Patient completes demo step 4 (a Check-in reporting fever) without touching the screen. The red Alert appears on the Worklist, and its event has `input: "voice"`.
- With Read-aloud on, every companion screen reads aloud in Finnish and English, and "Call now" is read first.
- The browser makes no request to ElevenLabs directly, and no key appears in the frontend bundle.
- Every voice action is read back and confirmed before it is sent.

## Open questions

- Which ElevenLabs voices to use for Finnish and Swedish. Check pronunciation of medical words (bronkoskopia, keuhkosyöpä) early, before building on them.
- Time budget: person 4 already owns Learn, SMS and FHIR. If the day runs short, ship Read-aloud plus voice for the demo-step-4 Check-in first, then extend to the other screens.
