# Cancer Pathway Companion — hackathon build spec

Source plan: `Cancer Pathway Companion – MVP Plan (Junction 2026).md` (repo root). Domain vocabulary: `GLOSSARY.md`. Hard-to-reverse decisions: `docs/adr/0001`–`0006`. Wireframes (agreed 14 Nov, patient screens redesigned and Symptom Report added the same day): https://claude.ai/artifact/87qpPWJkCW8y2XQvaEX4EA. Symptom-reporting research: `docs/research/on-demand-symptom-reporting.md`.

Scope for this build: the demo script in the plan's section 7.2, for suspected lung cancer, demo county Western Uusimaa (real county name, synthetic figures), 8-hour build, 4 people working in parallel. `backend/` (`medml`) is unrelated and untouched.

## Decisions agreed on the wireframes (14 Nov)

1. The Coordinator flags the Referral from the Worklist: a "Flag referral" action on a warning-sign call-back row calls `POST /contacts/{id}/promote`.
2. A demo bar (current demo day + "Advance one day") sits on top of every screen in all three apps.
3. A "coughing up blood" warning-sign tap is graded red, not yellow: immediate red Worklist row that must be acknowledged; the Contact is told to seek care today.
4. The Equity Dashboard map is a tile map of all 21 wellbeing services counties plus Helsinki, real names, synthetic figures.
5. Demo county: Western Uusimaa (replaces "County X").
6. Learn is open to everyone, Contacts included.
7. The login screen is a neutral "strong identification (mocked)" placeholder, with no Suomi.fi or Omapolku branding.
8. A Trusted Person (renamed from Next of Kin) can view, confirm and submit Check-ins and Symptom Reports on the Patient's behalf, all logged as proxy.
9. Accessibility: Read-aloud and Voice Mode on every companion screen, through ElevenLabs (ADR-0005, issue 06).
10. Symptom Report: an unscheduled, non-urgent report for Patients (phase 2 onward) and their Trusted People, reached from "Report a symptom" on Home, the Help screen and the trusted-person view. Safety Check → pick a symptom → guided questions → optional Own Words → result. Fixed rules only (ADR-0006).
11. Help on every companion screen: a header button opening "Who to call", ranked 112 → 116 117 → Nurse Aino → Report a symptom.
12. Patient screens follow the redesign: no phase names or day counter (the 6-week goal lives on Pathway), one question per screen in every flow, no required typing, the design-system note on the canvas (Atkinson Hyperlegible Next, 17 px body, 48 px targets).

## Finnish context (UI text stays in English for the judges)

Every screen's content uses Finnish services and formats, as in the wireframes:

- **Demo pathway in Western Uusimaa** (plausible HUS routes, not confirmed; check with a mentor):
  - warning sign → nurse call-back → health station (terveysasema) visit and chest X-ray
  - → referral to the HUS lung clinic
  - → chest CT at Jorvi Hospital, Espoo (HUS imaging)
  - → bronchoscopy at the HUS Heart and Lung Center
  - → treatment plan → first treatment at the HUS Cancer Center
- **Help numbers** (HUS patient guidance, see the research file §Q6):
  - 112 in an emergency.
  - 116 117 (Päivystysapu) or the nearest emergency department when the person suddenly feels much worse, day or night. During treatment, a temperature of 38 °C or more means the emergency department.
  - Nurse Aino, weekdays 8–16, for questions about the pathway.
  - Report a symptom for anything non-urgent; reply within 1–2 working days.
  - The Help screen, the Check-in red alert, the Symptom Report screens and the care-plan card all show these. The HUS Cancer Center is not given as an urgent line.
- **National services named in the UI:**
  - Strong identification by bank ID or mobile certificate (mocked, ADR-0004).
  - Appointments also sent to Suomi.fi Messages.
  - Medicines from prescriptions in Kanta (FHIR mock-up, issue 05).
  - Kela card to bring to visits, and Kela travel reimbursement for a taxi.
  - HSL buses for directions.
- **Language:** the selector offers Finnish, Swedish and English (Western Uusimaa has a large Swedish-speaking population). Learn offers Selkosuomi, Svenska and English.
- **Formats:**
  - dates as 18.11. or 14.11.2026
  - times as 9.30
  - decimals with a comma (38,6 °C)
  - store ISO values in Mongo and format only in the UI
- **Names:** Finnish demo names (Nurse Aino; patients Matti K., Leena S. and others), all fictional.
- **Learn source label:** "Syöpätalo (Cancer Hub), Terveyskylä.fi".

## Architecture

- One frontend (React + Vite) with three route groups: `/companion`, `/worklist`, `/dashboard`, plus a shared fake-login screen that picks a demo identity and routes into one of the three.
- One shared backend (new directory, e.g. `server/`): Python + FastAPI + Motor (async PyMongo).
- Datastore: MongoDB. Local `mongod` for the build; swap the `MONGODB_URI` env var to Atlas once Junction credits/cluster exist. No other code changes needed (ADR-0001).
- Worklist and dashboard poll the backend every few seconds rather than using websockets/SSE.
- No real auth (ADR-0004): the login screen is cosmetic, backed by a handful of preset demo identities (one Patient, one Trusted Person, one Coordinator, one county-admin viewer).
- Demo time does not run on the wall clock: `POST /demo/advance-day` bumps a single `clock_state` document and re-evaluates every Patient's Alerts/Escalation Steps for the new day (ADR-0004). A shared demo-bar component shows the current day and the advance button on every screen of all three apps.
- Voice: the browser never talks to ElevenLabs directly. The server proxies text-to-speech and speech-to-text with the key from `.secrets/elevenlabs_key` (ADR-0005).

## Data contract (Mongo collections)

All documents get `_id` (ObjectId) and `created_at` (UTC datetime) unless noted.

**contacts** — phase 0–1 people (ADR-0002)
```
county: str
language: str
consent: { warning_sign_contact: bool, at: datetime }
risk_check: { taken: bool, risk_group: str | null, at: datetime | null }
warning_sign_tap: { symptom: str, at: datetime } | null
trusted_people: [{ name: str, relationship: str, contact_method: str, consented_at: datetime }]
accessibility: { read_aloud: bool, voice_mode: bool, text_size: "m" | "l" | "xl", high_contrast: bool }
promoted_patient_id: ObjectId | null
```

**patients** — created only by the promotion endpoint (ADR-0002)
```
contact_id: ObjectId
county: str
demographics: { age: int, language: str, education_group: str, municipality_type: str }
coordinator_id: ObjectId
referral: { flagged_by: str, source: str, at: datetime }   # at == pathway_clock.started_at
phase: "suspected_cancer" | "treatment"
pathway_clock: { started_demo_day: int, current_demo_day: int }
trusted_people: [ ... same shape as contacts.trusted_people ]
accessibility: { ... same shape as contacts.accessibility, copied at promotion }
```

**events** — append-only log, one collection for every patient/contact action
```
subject_type: "contact" | "patient"
subject_id: ObjectId
type: "warning_sign_tap" | "confirmation" | "checkin" | "symptom_report" | "medication_log" | "sms_sent" | "fhir_sync"
payload: { ... shape depends on type, see issue files; symptom_report below }
actor: "self" | "trusted_person" | "coordinator"   # "trusted_person" = proxy; confirmations, check-ins and symptom reports only
input: "touch" | "voice"                        # "voice" = submitted through Voice Mode after a spoken read-back
demo_day: int
```

`symptom_report` payload (ADR-0006; rules in issue 04)
```
safety_check: { ticked: [str] }          # item ids; any → grade "red", symptoms may be empty
symptoms: [{
  symptom: "breathlessness" | "cough" | "pain" | "fever_unwell" | "tired_appetite" | "other",
  answers: { <question_id>: <option_id | number> },
  grade: "red" | "yellow" | "green"
}]
own_words: { text: str, source: "voice" | "typed" } | null   # verbatim, never graded
grade: "red" | "yellow" | "green"         # worst wins; two or more yellows → red
rule: str                                  # e.g. "2 yellows (breathlessness, fever_unwell)"
rules_version: str                         # e.g. "0.3"
advice_shown: "call_now" | "nurse_review" | "self_care"
```

**alerts** — symptom-driven (ADR-0003): Check-ins and Symptom Reports for Patients, red warning-sign taps for Contacts
```
patient_id: ObjectId
level: "red" | "yellow" | "green"
source: "checkin" | "symptom_report" | "warning_sign_tap"
reason: str                 # e.g. "Breathlessness on stairs, new, getting worse"
trigger_event_ids: [ObjectId]   # a new report on the same symptom while the alert is open appends here instead of creating a new alert
acknowledged_by: ObjectId | null
acknowledged_at: datetime | null
```

**escalation_steps** — time-driven, phase 2+ (ADR-0003)
```
patient_id: ObjectId
step_index: 0 | 1 | 2 | 3 | 4   # day 0 / 2 / 3 / 5 / 7
rung: "message_sms" | "auto_call" | "nurse_call" | "trusted_person" | "flag_health_centre"
due_demo_day: int
fired_at: datetime | null
confirmed_at: datetime | null
```

**coordinators**
```
name: str
county: str
```

**counties** — hand-authored fixture, 22 docs (21 wellbeing services counties + Helsinki), seeded once (not written to at runtime); real names, synthetic figures
```
name: str                       # real names: "Western Uusimaa", "Pirkanmaa", "Helsinki", ...
tile: { col: int, row: int }    # position on the dashboard tile map, see wireframe
pct_within_target: float
median_days_referral_to_treatment: float
reach_rate_over_75: float
breakdown: { age: {...}, language: {...}, education_group: {...}, municipality_type: {...} }
```

**clock_state** — singleton
```
_id: "demo"
current_demo_day: int
```

## Core API surface

```
POST /contacts                          create a Contact (onboarding / risk check)
POST /contacts/{id}/warning-sign-tap     records tap, logs event, queues call-back
POST /contacts/{id}/promote              Contact -> Patient (ADR-0002), starts pathway_clock; called from the Worklist's "Flag referral"
PATCH /contacts/{id}/accessibility       Read-aloud / Voice Mode / text size / contrast (Patients: PATCH /patients/{id}/accessibility)

GET  /patients/{id}
POST /patients/{id}/checkin              symptom check-in -> may create an Alert
POST /patients/{id}/symptom-report       Symptom Report -> { grade, advice_shown, rule }; every report creates or updates an Alert
POST /patients/{id}/medication-log
POST /escalation-steps/{id}/confirm      Confirmation; stops that rung

GET  /worklist?coordinator_id=...        merges alerts + escalation_steps + call-backs, sorted
POST /alerts/{id}/acknowledge

GET  /dashboard/counties                 reads the counties fixture
POST /dashboard/simulate                 sliders -> recomputed days-saved (pure function, no DB write)

POST /demo/advance-day                   bumps clock_state, re-fires escalation/alert rules

POST /learn/ask                          proxies to the Nemotron endpoint in opencode.json, retrieval-restricted to the allowed sources (plan section 4.6)

POST /voice/tts                          { text, language } -> audio; proxies ElevenLabs text-to-speech (ADR-0005)
POST /voice/stt                          audio -> { transcript }; proxies ElevenLabs speech-to-text (ADR-0005)
```

## Role breakdown

- `issues/01-shared-infra.md` — Mongo collections, FastAPI skeleton, demo-day engine, fake-login screen. Build this first; everyone else depends on it.
- `issues/02-equity-dashboard.md` — person 1 (dashboard builder in plan section 7.3)
- `issues/03-patient-companion-app.md` — person 2
- `issues/04-coordinator-worklist.md` — person 3
- `issues/05-learn-sms-fhir.md` — person 4
- `issues/06-voice-and-read-aloud.md` — person 4 after 05, with person 2 wiring each companion screen

## Explicit non-goals for this build

- No real SMS/telecom, no real Kanta/FHIR server, no real Suomi.fi/eID login (ADR-0004).
- No statistically generated synthetic cohort — the dashboard reads a hand-authored fixture (22 counties).
- No real patient audio or health data sent to ElevenLabs: demo identities only, until EU data residency and retention are settled (ADR-0005).
- No production auth, access control, or audit logging.
- `backend/` (`medml`) is not touched or referenced by any of this.
