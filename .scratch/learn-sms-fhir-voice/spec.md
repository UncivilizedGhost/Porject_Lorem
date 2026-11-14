Status: ready-for-agent

# Learn, simulated SMS/FHIR, Read-aloud and Voice Mode (person 4)

Part of the Cancer Pathway Companion build: umbrella spec `.scratch/pathway-companion/spec.md` (data contract for `events`, Finnish context, decisions agreed 14 Nov). Absorbs issue 05 and issue 06 (the server proxy and the voice layer; person 2 registers each companion screen's actions). Domain terms: `GLOSSARY.md` (Read-aloud, Voice Mode, Own Words, Contact, Patient, Trusted Person). Decisions: ADR-0004 (simulated SMS/FHIR), ADR-0005 (ElevenLabs behind a proxy, on-screen actions only), ADR-0006 (Own Words verbatim). Source: plan sections 4.3, 4.6, 5, 6.

Wireframes: https://claude.ai/artifact/87qpPWJkCW8y2XQvaEX4EA. Artboards:

- "9 · Learn"
- "10 · Accessibility settings": the toggles. Person 2 builds the screen; this spec owns what the toggles do.
- "11 · Voice Mode (check-in)"
- "Simulated SMS / FHIR log"
- "R5 · In your own words (optional)": the "Hold to speak" part.

Also the canvas notes n9, na, nv, ns and r5.

Demo-script steps this spec must carry (plan section 7.2): 3 (an SMS goes out and goes unanswered: visible as simulated), 4 (by voice: the Check-in reporting fever completed hands-free, the event carries `input: "voice"`), 5 ("What is a bronchoscopy?" → plain-language answer with source).

## Problem Statement

A Patient on a lung cancer Pathway is told about a bronchoscopy, a CT and a treatment plan in clinical language. Searching online gives frightening or wrong answers. An AI chatbot that answers from its own knowledge would be worse: unsourced, possibly wrong, and possibly giving advice it has no business giving. Many of the people most at risk of falling behind on the Pathway are over 75, have low vision, low literacy, shaky hands or speak Swedish. A screen full of small buttons and text fields shuts them out, and so does any feature that requires typing.

The demo also has to show messages going out and records being shared with Kanta without pretending a real SMS gateway or FHIR server exists. Otherwise judges either assume it's real or can't see that anything happened.

## Solution

- **Learn:** answers questions only by rephrasing passages retrieved from a small local corpus of the allowed Finnish sources, and always shows the source. With no source, it says "ask your nurse" with the number. A question containing red-flag words gets a fixed safety message, never a generated answer.
- **Simulated SMS and FHIR:**
  - Every SMS another feature "sends" and every Kanta sync is written as a visible event labelled "(simulated)".
  - A log page shows them, so the demo can point at "a message went out".
- **Read-aloud:**
  - When on, each companion screen reads its heading and main content on arrival. Safety messages and "Call now" are always read first.
  - "Read this page" is on every screen, on or off.
- **Voice Mode:**
  - A hold-to-talk button (never always-listening) turns speech into text through our server.
  - The text is matched by plain string rules against the actions on the current screen plus a few global words.
  - Every action is read back and runs only after a spoken "yes".
  - Own Words is the one dictation field, stored verbatim after read-back.
- **ElevenLabs** provides Finnish, Swedish and English voices and speech-to-text. The browser only ever talks to our server, which holds the key.

## User Stories

### Learn

1. As a Patient, I want to ask "What is a bronchoscopy?" and get a short, plain-language answer, so that I understand my next test.
2. As a Contact, I want Learn open to me before any Referral, so that I can read about warning signs and tests.
3. As a Trusted Person, I want to use Learn too, so that I can understand what the Patient is going through.
4. As any Learn user, I want every answer to show its source ("Syöpätalo (Cancer Hub), Terveyskylä.fi" or the specific source), so that I can trust and check it.
5. As any Learn user, I want an answer only from the reviewed sources, never the AI's own knowledge, so that I'm not misinformed.
6. As any Learn user, I want "I don't have a reviewed answer for that; ask your nurse" with Nurse Aino's number when no source fits, so that I'm sent to a person rather than a guess.
7. As any Learn user who types something like "I'm coughing blood" or "fever", I want the fixed safety message (112, 116 117, 38 °C rule) instead of an explanation, so that I act on a danger sign.
8. As any Learn user, I want no diagnosis, prognosis or dosing in answers, so that Learn stays an explainer.
9. As any Learn user, I want answers in Finnish (Selkosuomi), Swedish or English, so that I read in my language.
10. As any Learn user, I want a few suggested questions, so that I can start without typing.
11. As a demo team, we want 8–10 questions sanity-checked by someone playing clinician before the demo, so that we know the answers are faithful.

### Simulated SMS and FHIR

12. As a demo presenter, I want every simulated text message written to a log with time, recipient, text and "(simulated)", so that I can show a message went out without a real phone.
13. As a demo presenter, I want the log to show automated calls and their outcome too (answered / not answered), so that the Escalation Step ladder is visible.
14. As a demo presenter, I want simulated Kanta/FHIR syncs listed with a FHIR-shaped payload I can expand, labelled "FHIR mock-up", so that the integration story is visible but never mistaken for real.
15. As another builder, I want one `send_sms` helper and one `log_fhir_sync` helper on the server, so that I never write my own fake.
16. As a Coordinator, I want an SMS reply to be simulatable from the log (e.g. "reply YES"), so that delivery status on the Worklist can show "text message confirmed" in the demo.
17. As a Patient, I want "Medicines from prescriptions in Kanta" to show a FHIR mock-up source, so that the demo shows where the list would come from.

### Read-aloud

18. As a Patient with low vision, I want each screen read aloud on arrival when Read-aloud is on, so that I don't have to read small text.
19. As any companion user, I want a "Read this page" control on every screen even when Read-aloud is off, so that I can hear a screen once.
20. As any companion user, I want "Call now" and fixed safety messages always read first, so that the urgent part is never buried.
21. As any companion user, I want normal and slow speech speeds, so that I can follow.
22. As any companion user, I want Read-aloud in Finnish, Swedish or English to match my language setting, so that I understand it.
23. As any companion user, I want Read-aloud to keep working if the voice service is down (falling back to the browser's own speech), so that the app never goes silent.
24. As a screen-reader user, I want Read-aloud to sit alongside my device's screen reader, not replace it, so that my usual tools keep working.
25. As a Learn user, I want the answer and its source read aloud, so that I can listen.

### Voice Mode

26. As a Patient who can't use the touchscreen well, I want a large hold-to-talk microphone button (at least 56 px) above the bottom bar, so that I can speak instead of tapping.
27. As any companion user, I want the microphone never to listen unless I hold the button, so that my privacy is kept.
28. As a Voice Mode user, I want what I said matched only to the actions on the current screen plus yes, no, repeat, back, help and "call my nurse", so that the app does exactly what's on screen and nothing else.
29. As a Voice Mode user, I want every matched action read back ("Confirm the chest CT on Tuesday at 9.30? Say yes or no.") and run only after I say "yes", so that a misheard word never sends anything.
30. As a Voice Mode user, I want "I didn't catch that. You can say:" followed by the screen's actions when nothing matches, so that I learn what to say.
31. As a Voice Mode user, I want to answer risk-check questions by voice, numbers included, so that I can do the whole risk check hands-free.
32. As a Contact, I want to say "I have this" for a warning sign, so that I can raise it by voice.
33. As a Patient, I want voice to replace the slide-to-confirm, so that I can confirm without a gesture.
34. As a Patient, I want each Check-in item read with its options and to answer by saying an option, with temperature spoken as a number ("thirty-eight point six"), so that I can complete the Check-in hands-free.
35. As a Patient, I want to log a medicine as taken, skipped or side effect by voice, so that logging is easy.
36. As a Learn user, I want my spoken question to fill the question box, so that I don't have to type.
37. As a Trusted Person, I want Voice Mode for confirmation, Check-in and Symptom Report on the Patient's behalf, so that I can help hands-free too.
38. As a Patient, I want Safety Check items, "None of these", the symptom choice and each guided answer matched by voice like any other action, so that the Symptom Report works by voice.
39. As a Patient, I want my Own Words dictated, read back, and saved verbatim only after I say "yes", so that what's stored is exactly what I meant.
40. As a Patient, I want red-flag words (fever, blood, can't breathe) in a spoken Check-in answer or in my Own Words to trigger the fixed safety message read aloud at once, so that I'm told to act straight away.
41. As a Coordinator, I want events submitted by voice marked `input: "voice"`, so that I know how the answer was given.
42. As a Patient, I want my audio never stored, so that my voice isn't kept.

## Implementation Decisions

### Learn (server)

- Local corpus:
  - A small hand-collected set of plain-language passages (target 20–40) from the allowed sources in plan section 4.6: Health Village Cancer Hub (Syöpätalo), the Pirkanmaa and OYS lung cancer pathways, Käypä hoito patient versions, kaikkisyovasta.fi, and county instructions.
  - Each passage stores id, language, title, text, source label and URL.
  - The corpus must cover the demo question (bronchoscopy), CT, X-ray, the warning signs, the 6-week goal and Kela travel reimbursement.
  - Licences are checked before reuse.
- Retrieval: keyword/BM25-style scoring over the corpus in the question's language, top 1–3 passages above a minimum score. No embeddings needed for the demo.
- `POST /learn/ask`:
  - Body: `{ question, language }`.
  - Pipeline:
    1. red-flag word check: any match → `{ kind: "safety", text, sources: [] }` with the fixed message (112, 116 117, 38 °C during treatment → emergency department)
    2. retrieval: nothing above the threshold → `{ kind: "no_source", text, sources: [] }` with "ask your nurse" and Nurse Aino's number
    3. otherwise the Nemotron endpoint is asked to rephrase only the retrieved passages, in plain language and the requested language, with no diagnosis, prognosis or dosing → `{ kind: "answer", text, sources: [{ label, url, passage_id }] }`
  - Model failure or timeout → return the best passage's text verbatim with its source (still sourced).
- Nemotron client: endpoint and model from the `verda-nemotron` provider setup (`.env` / `.secrets/verda_inference_key`), never in the frontend. Share one small client with person 1's dashboard summary; whoever lands first owns it.
- Red-flag word list: a fixed list in Finnish, Swedish and English, shared by Learn and Voice Mode. It is not the grading engine. It only triggers the safety message (ADR-0006: it never sets or lowers a grade).

### Learn (screen in frontend-patient)

- The "9 · Learn" route inside person 2's shell:
  - suggested questions as buttons
  - a question box with a visible label
  - the answer card with source chip(s)
  - Learn's own language toggle: Selkosuomi / Svenska / English
- Registers voice actions: each suggested question, "ask" (dictation fills the box), "read answer".

### Simulated SMS and FHIR (server)

- `send_sms(to, text, subject_type, subject_id, purpose)` writes an `events` row:
  - `type: "sms_sent"`
  - payload `{ to, text, purpose, channel: "sms" | "auto_call" | "suomi_fi", simulated: true, status: "sent" }`
  - The same helper with `channel: "auto_call"` covers the day-2 call rung.
  - Exposed as a server-side function the other builders import. Must exist as a no-op stub in hour 1 with this exact signature.
- `log_fhir_sync(subject_type, subject_id, resource_summary)`:
  - writes `type: "fhir_sync"` with a minimal FHIR R4 `Bundle` (type `collection`) holding one `Observation` (or `MedicationStatement` for the medicine list)
  - payload carries `mock: true`
  - Called on Check-in submit and for the Kanta medicine list.
- `GET /sim/log?limit=…` returns `sms_sent` and `fhir_sync` events newest first.
- `POST /sim/sms/{event_id}/reply`:
  - body `{ text }`
  - writes a reply event (`sms_sent` payload `status: "replied"` on a new row linked by `reply_to`), so person 3's delivery status can show "text message confirmed"
  - a "YES" reply to a Confirmation SMS calls the Confirmation path for the linked Escalation Step
- `GET /patients/{id}/kanta-medicines` returns the fixture medicine list wrapped as a FHIR mock-up, with a "(FHIR mock-up)" label, for person 2's Medicines screen.

### SMS / FHIR log page (frontend-healthcare-provider)

- A route in person 1's shell, matching the "Simulated SMS / FHIR log" artboard.
- Rows: time (Finnish format), channel, recipient, text, status, and a "(simulated)" / "FHIR mock-up" badge on every row.
- An expandable JSON payload for FHIR rows, and a "Simulate reply" button on SMS rows.
- Polls every few seconds.

### Voice proxy (server)

- `POST /voice/tts`:
  - Body: `{ text, language, speed: "normal" | "slow" }` → audio/mpeg.
  - ElevenLabs multilingual model, with a voice chosen per language.
  - Disk cache keyed by a hash of (text, language, voice, speed), so the demo replays instantly and re-billing is avoided.
- `POST /voice/stt`:
  - Body: a short `MediaRecorder` recording (multipart) and `language` → `{ transcript }`.
  - ElevenLabs speech-to-text with a language hint.
  - Audio is not stored (ADR-0005).
- Key loaded from `.secrets/elevenlabs_key`, the same way as the Nemotron key. Never sent to or bundled in the frontend.
- Missing key: log loudly at startup. `/voice/tts` returns 503 with `fallback: "browser"`, and `/voice/stt` returns 503.
- Only demo identities' text and audio are sent (ADR-0005 data residency).

### Voice layer (frontend-patient), the contract with person 2

- A provider at the app root holds the language, `read_aloud`, `voice_mode` and speed from the person's accessibility settings.
- The screen-facing API:
  - **Action registration:** `{ id, label, synonyms, confirm_text, run }`, with `confirm_text` optional (defaults to the label as a question). A screen's actions are cleared when it unmounts.
  - **Readable content marking:** heading, body, and `priority` for safety / "Call now" text, which is always read first.
  - **Dictation:** `dictate({ prompt })` returns a read-back-confirmed transcript, for R5 Own Words and the Learn box.
- **Read-aloud player:**
  - plays priority content first, then the heading, then the body
  - plays on arrival when `read_aloud` is on, and on "Read this page" always
  - `/voice/tts` first, and on failure or 503 the browser's `speechSynthesis` in the same language
  - stops when the screen changes
- **Voice Mode button** (≥ 56 px, above the bottom bar, shown when `voice_mode` is on):
  1. Hold records; release sends to `/voice/stt`.
  2. The transcript goes to the matcher.
  3. On a match, the read-back is spoken and the layer listens for yes/no on the next hold.
  4. "yes" → `run()` with the voice context. "no" → "OK, cancelled."
  5. No match → "I didn't catch that. You can say:" plus the labels.
- **Matcher:** a pure function over (transcript, actions, global words, language) → match or none. Rules:
  - lowercase, strip punctuation and Finnish/Swedish diacritic variants
  - exact or contained label or synonym
  - number parsing for number-kind actions (spoken numbers in fi/sv/en, decimal comma or "point/pilkku/komma"), e.g. "kolmekymmentäkahdeksan pilkku kuusi" → 38.6
  - global words: yes, no, repeat, back, help, "call my nurse" (fi/sv/en)
  - No language model is involved (ADR-0005).
- **Voice context:** while a voice-confirmed action runs, the API client adds `input: "voice"` to the write. Person 2's API client reads it from the voice layer, so screens don't pass it by hand.
- **Red-flag words:** a match on the shared list in a spoken Check-in answer or in dictated Own Words → speak the fixed safety message at once (priority). The answer or Own Words are still saved unchanged, and grading stays in person 3's rules.
- **Coverage:** every companion interaction listed in issue 06 task 6. Person 2 registers the actions; this spec owns the matcher and flow, and checks coverage at the end with a walkthrough per screen.

### Contracts with the other builders

- **Provides to person 3:** `send_sms`, `log_fhir_sync`, the SMS reply simulation.
- **Provides to person 2:** the voice layer API, the Learn screen, `GET /patients/{id}/kanta-medicines`.
- **Provides to person 1:** the shared Nemotron client (or reuses theirs).
- **Depends on person 3:** the server skeleton, `events` model, `POST /escalation-steps/{id}/confirm` (for "YES" replies).
- **Depends on person 2:** the shell's hold-to-talk slot and accessibility settings.
- **Depends on person 1:** the provider-app shell for the log route.

## Testing Decisions

- Good tests check behaviour someone outside the module can see: the API response for a question, the event written by a helper, what the matcher returns for a transcript, and what the person sees or hears in the flow. They don't check retrieval scoring internals or component state.
- **Seam 1, pure modules, called directly.**
  - Matcher:
    - an exact label matches
    - a synonym matches
    - an unrelated phrase gives no match
    - "yes" / "kyllä" / "ja" map to yes
    - spoken numbers parse in fi/sv/en (including 38,6 forms)
    - a match is only ever among the given actions
  - Learn guardrails:
    - red-flag words in fi/sv/en → `safety`
    - a question with no corpus hit → `no_source`
    - the demo question retrieves the bronchoscopy passage
- **Seam 2, the HTTP API.** pytest + FastAPI's test client against a throwaway local Postgres schema, external clients stubbed:
  - `POST /learn/ask` "What is a bronchoscopy?" returns `answer` with a source; with the model stubbed to fail, it returns the passage verbatim with its source
  - `send_sms` writes an `sms_sent` event with `simulated: true` that appears in `GET /sim/log`
  - a "YES" reply confirms the linked Escalation Step
  - `log_fhir_sync` writes a Bundle with one resource and `mock: true`
  - `/voice/tts` returns cached audio on the second call without calling ElevenLabs again; it returns 503 with `fallback` when the key is missing
  - `/voice/stt` returns the stubbed transcript and stores no audio
- **Seam 3, frontend components.** Vitest + Testing Library in frontend-patient, with `/voice/*` and the recorder mocked:
  - a matched voice action is read back and `run` is not called until "yes"
  - "no" cancels
  - no match lists the screen's actions
  - a voice-confirmed submit carries `input: "voice"`
  - priority content is queued before the heading
  - a TTS 503 falls back to `speechSynthesis`

  In frontend-healthcare-provider: every log row shows a "(simulated)" or "FHIR mock-up" badge.
- **Prior art:**
  - `backend/tests/test_elevenlabs_tts.py`, a hermetic test that stubs the ElevenLabs client's text-to-speech call with `unittest.mock` and writes to `tmp_path`. Use the same pattern for the proxy, and `backend/src/medml/elevenlabs_tts.py` as a reference for model and voice defaults (`eleven_multilingual_v2`).
  - Don't import from `backend/`. It stays untouched.

## Out of Scope

- A real SMS gateway, automated-call provider, Suomi.fi Messages delivery or real Kanta/FHIR server (ADR-0004).
- ElevenLabs' conversational agent product, or any language model interpreting speech or Own Words (ADR-0005, ADR-0006).
- Always-listening or wake-word voice. Storing audio.
- Voice or Read-aloud on the Worklist and Dashboard.
- The full ~50-question clinician quality check (plan section 4.6). The demo bar is 8–10 questions.
- Machine-translated languages beyond fi/sv/en. Embeddings or a vector store for Learn.
- Real patient data to ElevenLabs before EU data residency and retention terms are settled (ADR-0005).

## Further Notes

- Pick and check Finnish and Swedish voices early: test pronunciation of bronkoskopia and keuhkosyöpä before building on them.
- Time budget fallback (issue 06): if the day runs short, ship in this order:
  1. Learn + SMS/FHIR helpers and log (others depend on `send_sms`)
  2. Read-aloud
  3. voice for the demo-step-4 Check-in
  4. the other screens
- The `send_sms` / `log_fhir_sync` stubs must exist in hour 1 with their final signatures. Person 3's promotion and advance-day code calls them.
