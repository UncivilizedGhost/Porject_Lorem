# Patient companion (frontend-patient)

React + Vite app for the patient companion (Home, Pathway, Medicines, Learn, Settings). Learn is person 4's screen (artboard "9 · Learn").

```bash
cd frontend-patient
npm install
npm run dev        # :5173, proxies /api/* to the server at :8000
```

Open `/learn` in the app. The Learn tab is in the bottom nav and is open to Contacts, Patients and Trusted People.

## Learn tab

Implements `.scratch/learn-sms-fhir-voice/spec.md` (issue 05/06, plan sections 4.6 and 5):

- Suggested questions as buttons, a labelled question box, and an answer card with source chip(s).
- Learn's own language toggle: English / Selkosuomi / Svenska.
- Calls `POST /learn/ask` with `{ question, language }` via `api.learnAsk`. The server checks red-flag words first, then retrieves from the local corpus and rephrases via Nemotron, returning `{ kind, text, sources }` where `kind` is `answer`, `safety`, or `no_source`.
- If `/learn/ask` is unreachable, the screen falls back to `src/screens/Learn/learnCorpus.ts` — a hand-collected corpus of plain-language passages from the allowed sources (Syöpätalo/Terveyskylä.fi, Kaikki syövästä/Syöpäjärjestöt, Terveyskirjasto/Duodecim, Finnish Cancer Registry, FICAN, Kela, Pirkanmaa pathway) — so the demo keeps working offline.
- Red-flag words (chest pain, can't breathe, coughing up blood, fever, etc., in fi/sv/en) show the fixed safety message (112, 116 117) and never call the model. Shared list lives in `src/voice/redFlags.ts` and is also used by Voice Mode.
- No reviewed source → fixed "ask your nurse" message with Nurse Aino's number (`+15550100`) and call/message buttons. The UI never shows an answer without a source.
- Every answer shows its source(s) with a link to the original page. A "Read aloud" button speaks the answer (browser `speechSynthesis`; `/voice/tts` from issue 06 can replace it). The screen marks itself readable (`useReadable`) so the header's "Read this page" works.
- Registers voice actions: each suggested question, "ask by voice" (dictation fills the box), and "read answer". A spoken question is matched against suggested labels and the answer is read back.

The corpus is intentionally small and not a substitute for the backend; it covers the demo question ("What is a bronchoscopy?"), "what is cancer", lung cancer, symptoms, warning signs, diagnosis, treatment, prognosis, risk factors, the 6-week goal, hospital visits, medicines, travel costs and support.

The demo nurse number follows `spec.md` (Nurse Aino, weekdays 8–16). Emergency numbers: 112 and 116 117.

## Files

- `src/screens/Learn/LearnScreen.tsx` — the Learn screen (person 4).
- `src/screens/Learn/learnCorpus.ts` — sourced passages + client keyword retrieval.
- `src/voice/redFlags.ts` — shared red-flag word list (fi/sv/en).
- `src/styles/global.css` — Learn styles.
- `src/api/client.ts` — `learnAsk` (already present, person 4 endpoint).
