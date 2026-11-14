# Project audit — 2026-11-14

Read-only review of the Cancer Pathway Companion repository. No source, database rows, servers or builds were changed for this audit. The only file added is this document.

## Highest priority

### 1. Patient login drifts to a fresh, empty “Matti”

The chain:

- `frontend-patient/src/screens/Login/LoginScreen.tsx` sends every patient login to `/risk-check`.
- `RiskCheckFlow.tsx` calls `POST /contacts`, then replaces the session with `{ role, contactId }`, dropping the `patientId` returned by login.
- `frontend-patient/src/lib/usePatient.ts` auto-promotes that new Contact on the first patient screen.
- `server/app/services/demo_clock.py` (`identities`) returns the **newest** patient, and login uses that id.

Live database at audit time:

| Patient | Display name | Appointments | Events | Pathway started |
|---|---|---|---|---|
| `e3305919…` | Matti Virtanen | 3 | 107 | demo day 2 |
| `e58c9930…` | Matti Virtanen | 0 | 1 | demo day 59 |

`/demo/identities` returned `e58c9930…`, while all four open worklist alerts belonged to `e3305919…`.

Result: the companion opens a new Matti with no history, while the worklist shows the other Matti’s alerts. Every completed login/questionnaire also adds a Contact, a Patient, an SMS and an escalation ladder.

### 2. “No, do not contact me” is ignored

`server/app/services/promotion.py` never reads `consent.warning_sign_contact`. Auto-promotion therefore creates a pathway and sends “Your care pathway has started. Nurse Aino will contact you…” even for a person who declined contact. Consent is stored on the Contact but not used as a gate.

### 3. Promotion has a concurrency race

`usePatient` promotes during a fetch, and `frontend-patient/src/main.tsx` uses `React.StrictMode`, which double-runs mount effects in development. `currentPatientId` has no in-flight guard, and `promotion.promote` does a non-atomic read → insert → update. Two near-simultaneous promotions for one Contact can create two Patients, two ladders and two SMS rows. The current data has one patient per contact, but the structure allows duplicates.

### 4. API failures become permanent “Loading…” screens

`frontend-patient/src/lib/usePolling.ts` swallows every rejection and leaves `data` undefined.

- Home, Pathway and Medicines stay on “Loading…” forever after a 404 or network failure.
- The provider worklist shows its header and tabs but no rows, with no error or retry message.
- A failed promotion looks identical to loading.
- `POST /demo/reset` clears patients/contacts but the patient browser keeps its `sessionStorage` ids. After a reset, Home requests a deleted patient and stays on “Loading…” forever. Reset is API-only; neither `DemoBar` has a reset control.

### 5. The screening check is English-only

`frontend-patient/src/screens/RiskCheck/questions.ts` hardcodes all prompts, Yes/No, Male/Female, and the 23 county names in English. The app chrome translates, so a Finnish/Swedish user gets a mixed-language flow. Other clinical labels from the server (warning signs, Check-in prompts, medicine names) are also not translated by `dict.ts`; that is documented there as a scope decision, but it undercuts the language switch.

## Medium

- **Provider navigation**: `/dashboard` and `/sim-log` have no links from the worklist or anywhere else; `/sim-log` has no back link. A coordinator has no on-screen route to the dashboard or log. The provider shell also has no session guard, unlike the patient shell.
- **Tests are stale, not merely slow.** `LoginScreen.test.tsx` looks for “strong identification (mocked)”, “I am the patient” and “someone you trust”; the screen now says “Who is using the app?”, “Patient” and “Support person”. `PathwayScreen.test.tsx` expects an unpromoted Contact to see “nurse will call you”, contradicted by auto-promotion. `Booking/booking.test.tsx` was already identified as outdated. The suite was not run.
- **Worklist action surface is inconsistent.** The server offers `assign_to_me` and `record_action`, but `WorklistRow` has no buttons for them, so they are silently dropped. The filled primary button on alert rows is **Mark done**, because `PRIMARY_ORDER` reaches `mark_done` before `book_appointment`/`escalate`; those are secondary. `open_card` exists only for symptom-report alerts.
- **Booking**: the server accepts a past date (`booking.book` validates working days/hours but not “future”); the UI blocks it. Loading a type fetches 60 days of availability for every doctor in parallel. A network failure while fetching the row is shown as “This worklist row is no longer open”, which is misleading.
- **Voice**: the server log confirms no ElevenLabs key. TTS falls back to browser speech, but STT returns 503 and Learn’s microphone catch leaves the text box unchanged with no message. Hold-to-talk has the same dependency.
- **Promotion is a read side effect**: opening the care-plan card or the trusted view can promote a Contact. `promotion.promote` records `referral.flagged_by = coordinator` and `source = "worklist"` even when the patient’s own screen triggered it, so the audit trail is inaccurate.
- **Docs and branding drift**: the provider README documents `/dashboard/county/:name/insight/:cardSlug`, but the route uses `?dimension=&group=`. The root README says UI text is English. ADR-0001 still describes MongoDB while the code/README use PostgreSQL (ADR-0007). The app is called “Cancer Support” on the patient login, “Pathway Provider” in the provider title, and “Cancer Pathway Companion” in the API/docs.
- **Copy QA**: Swedish `trusted.note` contains “trappas påminnelserna **uupp**”; Finnish `selfcare.breathlessness` contains “**Istuhdu** pystyyn”. `LearnScreen` duplicates copy inside the component instead of using `dict.ts`; its Finnish title is “Opi” while the dict says “Kysy hoidostasi”, and the `learn.*` keys appear unused. `noPathway.body` (“The nurse will call you…”) now contradicts the assume-the-call-happened behaviour and is reachable only on promotion failure.
- **Deployment to verify**: both `vercel.json` files use `"/((?!api/).*)"` for the SPA fallback. Confirm that pattern is honoured by Vercel; if not, deep links such as `/worklist/book/...` and `/dashboard/county/.../insight` will 404 on refresh. API requests have no timeout or abort, so a hung request hangs the screen.

## Low / cleanup

- `frontend-patient/src/components/ProgressBar.tsx` is unused after removing the duplicate screening bar.
- 18 static prototype pages under `frontend-patient/app/`, `legacy/care-companion.html`, and `frontend-patient/tools/` are dead weight; `tools/extract.mjs` references a wireframe file that is no longer present. They still carry the old “Pathway Companion” branding.
- Root `backend/` (medml) is unrelated and unused.
- `.env.example` starts with a `[TEMPLATE]` line, which is not a valid dotenv entry.
- `R3PickSymptom.tsx` casts an icon name `as any`. The `lint` scripts are just `tsc`, so there is no real lint step.
- `SimLogScreen`’s “Simulate reply” has no catch around `api.simReply`; a failed reply throws silently. `DemoBar.advance` is also unhandled in both apps.

## Current demo state (verified read-only)

- Server healthy, `db: true`, demo day 59.
- 2 Contacts, 2 Patients (both “Matti Virtanen”), 3 open alerts, 4 done rows, worklist progress 57 %.
- 36 SMS events, 0 FHIR events (FHIR rows appear only after a medicine is logged).
- `/demo/identities` points at the new empty patient `e58c9930…`; the open alerts belong to `e3305919…`.

A `POST /demo/reset` before the demo fixes the data clutter, but the patient browser must then return to `/` and re-enter, or Home stays on “Loading…”.

## Not covered

Tests and builds were not run (per instruction); no browser was available; the hosted Vercel/Railway deployment and audio were not tested. Every area was sampled, but not all 268 files were read line by line.
