Status: ready-for-agent

# Coordinator Worklist, rules engine and server core (person 3)

Part of the Cancer Pathway Companion build: umbrella spec `.scratch/pathway-companion/spec.md` (data contract, Finnish context, decisions agreed 14 Nov). Absorbs issue 04 in full, the server-core half of issue 01 (skeleton, models, promotion, demo day) and the wireframe's Booking screen as a stretch goal. Domain terms: `GLOSSARY.md`. Decisions: ADR-0007 (Postgres/JSONB on Aiven, supersedes ADR-0001), ADR-0002 (promotion), ADR-0003 (Alert vs Escalation Step), ADR-0004 (demo shims), ADR-0006 (fixed rules, verbatim Own Words).

Wireframes: https://claude.ai/artifact/87qpPWJkCW8y2XQvaEX4EA. Artboards: "Coordinator worklist", "R7 · Nurse's Worklist card for the report", "Book appointment (from Worklist)" (stretch), plus the canvas notes "nw", "r7" and "nb".

Demo-script steps this spec must carry (plan section 7.2): 2 (call-back row, health station + X-ray booked), 3 (Flag referral starts the Pathway Clock, unanswered SMS climbs the ladder, Trusted Person confirms), 4 (Check-in reports fever → red "Call now" row).

## Problem Statement

A Coordinator in Western Uusimaa owns the Pathways of many Patients plus a stream of Contacts who have tapped a warning sign. Today the signals that need action arrive on separate channels: a symptom report here, an unanswered appointment letter there, a phone message from a worried daughter. Nothing says which person needs a call first. A Patient with fever during treatment can sit behind a routine rebooking. A Contact who taps "coughing up blood" waits for a call-back in 1–2 working days like everyone else. A letter that was never opened just runs out the clock. The Coordinator has no single list, no reason line per person, and no record of who has seen a red Alert.

The other three builders also need a server to build against from hour one. Without one shared skeleton, a shared data contract and one place where symptom grading lives, each of them would invent their own and the demo would not join up.

## Solution

One prioritised Worklist for the Coordinator. It merges three kinds of signal into a single list, sorted by "needs action today": symptom Alerts (from Check-ins, Symptom Reports and red warning-sign taps), Escalation Steps that have fired without a Confirmation, and Contacts waiting for a warning-sign call-back. Each row has one line of reason, delivery status, the Pathway Clock, and one-tap actions. Red rows must be acknowledged by name. "Flag referral" on a call-back row promotes the Contact to a Patient and starts the Pathway Clock. A Symptom Report opens as a card (R7) that shows the rule that set its grade, the answers, the Patient's Own Words verbatim and how long it has waited against the 1–2 working-day promise.

Behind it sits the shared server core: the FastAPI + asyncpg skeleton the others build on, the Pydantic models for the data contract, Contact-to-Patient promotion with the five-rung Escalation Step ladder, the demo-day engine, and one versioned rules module. That module grades every Check-in, Symptom Report and warning-sign tap and also serves the companion app the questions it asks, so grading is never hard-coded in a screen.

## User Stories

### Coordinator: the Worklist

1. As a Coordinator, I want one list of everyone who needs action today, so that I don't have to check several channels.
2. As a Coordinator, I want red Alerts at the top, then warning-sign call-backs, then overdue Confirmations, then yellow Alerts and trends, so that the most urgent person is always first.
3. As a Coordinator, I want oldest-first ordering within each band, so that nobody is starved by newer rows.
4. As a Coordinator, I want a one-line reason on every row (e.g. "Hoarseness 4 weeks, call-back due", "Letter unopened 72 h, no SMS reply", "Fever 38,6 °C during treatment"), so that I know why the person is on the list without opening anything.
5. As a Coordinator, I want each row to show delivery status in Finnish channel terms (Suomi.fi Messages opened / not opened, text message confirmed, automated call answered, Trusted Person reached), so that I know what has already been tried.
6. As a Coordinator, I want each Patient row to show the Pathway Clock as days used against the 6-week target and the next deadline, so that I can see who is close to running late.
7. As a Coordinator, I want Contact rows to show no Pathway Clock, so that I'm not misled into thinking a Referral exists.
8. As a Coordinator, I want the list to refresh by itself every few seconds, so that a red Alert from the companion app shows up without me reloading.
9. As a Coordinator, I want a red row to stay visually distinct until I acknowledge it, so that it can't be lost in the list.
10. As a Coordinator, I want to acknowledge a red Alert with one tap, recorded against my name and time, so that there is a named owner for every red Alert.
11. As a Coordinator, I want a "Call" action on every row that shows the person's number, so that I can phone straight away.
12. As a Coordinator, I want a "Book health station and X-ray" action on a warning-sign call-back row, so that phase 1's next step is one tap.
13. As a Coordinator, I want a "Flag referral" action on a warning-sign call-back row, so that when the X-ray raises suspicion I can promote the Contact and start the Pathway Clock myself.
14. As a Coordinator, I want "Rebook", "Mark handled" and "Hand to trusted person" actions on Escalation Step rows, so that I can close or redirect an overdue Confirmation.
15. As a Coordinator, I want a red warning-sign tap ("coughing up blood") to appear as a red row immediately, not as a call-back due in 1–2 days, so that the most dangerous sign isn't queued.
16. As a Coordinator, I want a row created by a Trusted Person to say "reported by [name], trusted person", so that I know who to call back and how much weight to give the answers.
17. As a Coordinator, I want a workload line (Alerts this shift, false-alarm share), so that I and my manager can see whether the alert volume is sustainable.
18. As a Coordinator, I want times and numbers in Finnish formats (10.42, 18.11., 38,6 °C), so that the list reads like the systems I already use.

### Coordinator: the Symptom Report card (R7)

19. As a Coordinator, I want one card per Symptom Report showing its grade and the rule that set it, so that I can see at a glance why it is red, yellow or green.
20. As a Coordinator, I want the card to show the rules version, so that a grade can be audited later even after the rules change.
21. As a Coordinator, I want the structured answers listed in plain words, so that I don't have to decode option ids.
22. As a Coordinator, I want the Patient's Own Words on their own tinted block, verbatim, labelled "spoken" or "typed", so that I can read exactly what they said without any machine interpretation.
23. As a Coordinator, I want to see the advice the Patient was shown (call now, nurse will review, self-care), so that I know what they have already been told.
24. As a Coordinator, I want to see how long the report has waited against the 1–2 working-day promise, so that I don't break the promise the app made.
25. As a Coordinator, I want a second report on the same symptom to add to the open card instead of making a new row, so that one worried Patient doesn't flood my list.
26. As a Coordinator, I want Call, Assign to me, Record action taken and Mark done on the card, so that I can close the loop from the card itself.

### Coordinator: booking (stretch)

27. As a Coordinator, I want "Book appointment" on a row to open a booking screen, so that I can book the next step without leaving the Worklist.
28. As a Coordinator, I want to pick an appointment type first (X-ray and low-dose CT, chemotherapy, immunotherapy, radiotherapy, surgery consultation, treatment and health-station check-ups), so that only the right clinicians are offered.
29. As a Coordinator, I want the calendar to enable only the days the chosen clinician works and only free times within their hours, so that I can't double-book.
30. As a Coordinator, I want confirming a booking to send the Patient a simulated text message, so that the demo shows the appointment reaching them.

### Patient and Trusted Person (behaviour this spec owns on the server)

31. As a Patient, I want a fever of 38 °C or more during treatment to be graded red at once, so that the Coordinator calls me today.
32. As a Patient, I want any Safety Check item I tick to grade my Symptom Report red, so that a danger sign never waits in a queue.
33. As a Patient, I want my Own Words never to change my grade up or down, so that how I phrase things can't make my report less urgent.
34. As a Patient, I want two moderate symptoms together to count as red, so that the combination is taken seriously.
35. As a Patient, I want my Confirmation to stop the Escalation Step ladder for that step, so that I'm not phoned about something I've already confirmed.
36. As a Trusted Person, I want my Confirmation on the Patient's behalf to stop the ladder too, logged as proxy, so that I can help without pretending to be them.
37. As a Trusted Person, I want a Check-in or Symptom Report I submit for the Patient to be graded exactly as if they had sent it, so that proxy reports are not discounted.
38. As a Patient, I want two missed doses of a medicine to raise a yellow Alert, so that the nurse knows before it becomes a problem.

### Contact (phase 0–1)

39. As a Contact, I want my warning-sign tap to put me on the Coordinator's call-back list with a simulated text message saying so, so that I know someone will call.
40. As a Contact who taps "coughing up blood", I want to be told to seek care today and to appear as red on the Worklist, so that I'm not left waiting days.

### Other builders and the demo team

41. As another builder, I want a running server with a health check in the first hour, so that I can start building against it.
42. As another builder, I want the data contract as Pydantic models I can import, so that a malformed document is rejected in code (the JSONB column won't reject it).
43. As another builder, I want the database connection string to come from one environment variable defaulting to local Postgres, so that we can switch to Aiven without code changes.
44. As the companion builder, I want one endpoint that serves the Safety Check items, the symptoms, their guided questions and option ids, and the Check-in items, so that my screens never hard-code grading.
45. As a demo presenter, I want "Advance one day" to fire whichever Escalation Steps are due and nothing else, so that the escalation ladder can be shown in seconds.
46. As a demo presenter, I want seven advances on a fresh unconfirmed Patient to fire all five rungs in order (day 0, 2, 3, 5, 7), so that the full ladder can be demonstrated.
47. As a demo presenter, I want a way to look up the demo identities' ids (the Coordinator, the most recent Contact and Patient), so that each app's login screen can route into the right record.
48. As a demo presenter, I want to reset the demo data to a known state, so that we can rehearse the demo more than once.
49. As a reviewer, I want every grade to be reproducible from the stored answers and the rules version, so that the logic can be audited.

## Implementation Decisions

### Server core (from issue 01)

- New top-level `server/` package: Python, FastAPI, asyncpg. `backend/` (medml) is not touched or imported.
- `DATABASE_URL` env var, default local Postgres (`server/compose.yaml`) on a `pathway` database. Documents as JSONB, one table per collection, through the helpers in `app/db.py` (insert / upsert / get / find / fetch / update / append / truncate). No Aiven-specific code (ADR-0007).
- One Pydantic model per collection in the umbrella data contract. These are the real schema: endpoints validate on the way in and on the way out. Other builders add models for their own collections (`counties`, `actions`, `decisions`) to the same models area.
- Startup seeds `clock_state` (`_id: "demo"`, `current_demo_day: 0`) and the demo Coordinator ("Nurse Aino", county "Western Uusimaa") if they are missing.
- `GET /health` returns ok plus whether the database is reachable.
- CORS open to the two frontend dev origins.
- Hour-1 deliverable, before the rules or Worklist: skeleton, models, `/health`, `clock_state` seed, and stub versions of every endpoint below that return fixed, contract-shaped data. The others build against the stubs.

### Endpoints owned here

- `POST /contacts/{id}/promote`: the only place a Patient is created (ADR-0002).
  - Copies county, Trusted People and accessibility from the Contact.
  - Sets `referral` (`flagged_by` the Coordinator, `source: "worklist"`).
  - Sets `pathway_clock.started_demo_day` to the current demo day, sets `phase: "suspected_cancer"` and `promoted_patient_id` on the Contact.
  - Creates five `escalation_steps` rows for the first pending Confirmation (rungs and due days 0/2/3/5/7 relative to the start day).
  - Sends the day-0 message through person 4's `send_sms`.
  - Promoting an already-promoted Contact returns the existing Patient (idempotent).
- `POST /demo/advance-day`: increments `current_demo_day`, advances every Patient's `pathway_clock.current_demo_day`, and sets `fired_at` on every unconfirmed step whose due day has been reached.
  - A fired `auto_call` or `message_sms` rung writes a simulated SMS/call event through person 4's helper.
  - Returns the new day and the list of steps that fired.
  - No cron, no background worker (ADR-0004).
- `POST /escalation-steps/{id}/confirm`: the Confirmation.
  - Body: `actor` (`self` | `trusted_person`), optional `trusted_person_name`, `input` (`touch` | `voice`).
  - Sets `confirmed_at` on that step and on every later unfired rung of the same ladder, so the ladder stops.
  - Writes a `confirmation` event.
- `POST /contacts/{id}/warning-sign-tap`:
  - Records `warning_sign_tap` on the Contact and writes a `warning_sign_tap` event.
  - Grades the tap through the rules module. "Coughing up blood" → a red Alert (`source: "warning_sign_tap"`), keyed to the Contact (see the note on `alerts.patient_id` below). Any other sign → the Contact becomes a call-back-pending Worklist row.
  - Sends a simulated SMS confirming the call-back.
  - Returns `{ grade, advice }` so the companion shows "nurse calls within 1–2 working days" or "seek care today".
- `POST /patients/{id}/checkin`:
  - Body: `answers` (item id → option id or number), `actor`, optional `trusted_person_name`, `input`.
  - Writes a `checkin` event, grades through the rules module, and creates or appends to an Alert when the grade is red or yellow.
  - Returns `{ grade, advice_shown }`.
- `POST /patients/{id}/symptom-report`: body is the umbrella's `symptom_report` payload minus the server-computed fields (`grade`, `rule`, `rules_version`, `advice_shown` are computed here, never trusted from the client).
  - Writes the event, then always creates an Alert, or appends to an open Alert for the same Patient and symptom.
  - Returns `{ grade, advice_shown, rule }`.
- `POST /patients/{id}/medication-log`:
  - Body: `{ medicine_id, status: "taken" | "skipped" | "side_effect", actor, input }`. Writes a `medication_log` event.
  - Two `skipped` entries for the same medicine without a `taken` between them → yellow Alert.
- `GET /rules`: the questions half of the rules module, for the companion. Returns:
  - `rules_version`
  - the Safety Check items (id, label, phase variant)
  - the symptoms (id, label) and, per symptom, the ordered guided questions (id, prompt, kind `choice` | `number`, options with ids and labels, units)
  - the "something else" PRO-CTCAE triple
  - the Check-in items
  - the warning-sign list
  - No grade maps are sent to the client.
- `GET /worklist?coordinator_id=…`: the merged, sorted list (shape below).
- `POST /alerts/{id}/acknowledge`: body `{ coordinator_id }`. Sets `acknowledged_by` / `acknowledged_at`. Idempotent.
- `POST /alerts/{id}/actions`: body `{ action: "assign_to_me" | "record_action" | "mark_done", note? }`. Appends to an `actions_taken` list on the Alert; `mark_done` closes it (adds `closed_at`; additive to the contract).
- `POST /contacts/{id}/callback-handled` and `POST /escalation-steps/{id}/handled`: "Mark handled" for the other two row kinds.
- `GET /demo/identities` returns the Coordinator id, the most recent Contact id and the most recent Patient id (with its first Trusted Person). Both login screens use it.
- `POST /demo/reset` truncates runtime tables (contacts, patients, events, alerts, escalation_steps, appointments, decisions) and reseeds `clock_state` and the Coordinator. Fixtures (`counties`, `actions`, `clinicians`) stay.

### Data contract additions

- `alerts.patient_id` is not enough for a red warning-sign tap, which belongs to a Contact. Replace it with `subject_type` + `subject_id`, mirroring `events`. On promotion, open Alerts keep pointing at the Contact; the Worklist shows them under the person either way. The umbrella spec's data contract is updated to match.
- `alerts` gains `symptom` (`str | null`, the grouping key for "same symptom while open"), `actor` (`self` | `trusted_person`), `trusted_person_name`, `actions_taken: [{ action, by, at, note }]` and `closed_at`.
- `contacts` gains `callback: { status: "pending" | "booked" | "handled", at }`.

### The rules module

One pure module with no I/O, versioned by a single `RULES_VERSION` constant, stored on every graded event (ADR-0006). It holds:

- **Safety Check items:** the seven "right now?" items from the research file (§3.2) with their phase variant (item 4 in treatment: 38 °C or more after cancer medicine in the last 6 weeks). Any ticked → red, `advice_shown: "call_now"`, rule "Safety Check: <item>".
- **Per-symptom guided questions** for breathlessness, cough/blood, pain, fever/unwell and tired/not eating: 2–4 questions each, each option mapped to green, yellow or red. Breathlessness follows the canvas note for R4: new or worse → when (stairs or fast walking = yellow; light effort or at rest = red; no change = green) → getting worse.
- **Fever rule** depends on `phase`:
  - On treatment: ≥ 38.0 °C, < 36.0 °C or generally unwell → red; 37.5–37.9 → yellow.
  - Not on treatment: > 38.0 °C with feeling unwell → red; 37.5–38.0 → yellow.
- **"Something else":** PRO-CTCAE severity + interference + new/worse → grade.
- **Combination:** worst wins; two or more yellows → red. The `rule` string is human-readable, e.g. "2 yellows (breathlessness, fever_unwell)".
- **Check-in grading:** the same symptom rules applied to the ~10 PRO-CTCAE items, with the Red Flags from plan section 4.4 (fever during treatment, breathlessness at rest, coughing up blood).
- **Warning-sign grading:** coughing up blood → red; any other sign → yellow (call-back).
- **Own Words** are accepted as an argument and ignored by grading, so the "never grades" rule is enforced in one place and can be tested.

Public interface, as pure functions:

- grade a Symptom Report payload with the Patient's phase → `{ grade, rule, advice_shown, per_symptom_grades }`
- grade Check-in answers with the phase → `{ grade, rule, advice_shown }`
- grade a warning-sign tap → `{ grade, advice }`
- return the questions catalogue

Thresholds are hackathon values from HUS and UKONS guidance and must be signed off by a clinical owner before any real use (ADR-0006).

### Worklist merge

`GET /worklist` returns rows of one shape:

```
{ row_id, kind: "alert" | "callback" | "escalation", band: 1..4, level: "red" | "yellow" | "green" | null,
  person: { subject_type, subject_id, display_name, county },
  reason: str, delivery_status: [str], pathway_clock: { day, target_days: 42, next_deadline } | null,
  reported_by: { actor, name } | null, created_at, waiting_working_days: float | null,
  acknowledged: bool, actions: [str], detail_ref }
```

- Bands: 1 red Alerts, 2 call-back-pending Contacts, 3 fired unconfirmed Escalation Steps, 4 yellow and green Alerts. Oldest first within each band.
- Closed Alerts and handled rows drop off.
- `delivery_status` comes from the `sms_sent` events and Escalation Step state:
  - **Digital recipient:** Suomi.fi Messages opened or not, text message confirmed, automated call answered, Trusted Person reached.
  - **Paper recipient** (plan section 4.2 read-status rule): only an SMS reply or an answered call counts as reached.
- Workload line, computed from today's Alerts (demo day): count per shift and the share closed as `mark_done` with the note "false alarm". A derived figure is enough for the demo.

### Worklist UI (frontend-healthcare-provider)

- Routes in the provider app: the Worklist, the Symptom Report card (R7) as a detail panel or route, and the Booking screen (stretch). The app shell, login and demo bar are owned by person 1. This spec adds its routes to that shell.
- Polls `GET /worklist` every 3–5 seconds.
- Row actions call the endpoints above. "Flag referral" calls `POST /contacts/{id}/promote` and the row moves out of the call-back band.
- Red rows show a must-acknowledge control. The row keeps its red marker until acknowledged.
- Finnish formats in the UI only; ISO values in the database.

### Booking (stretch, after acceptance is met)

- `clinicians` fixture, hand-authored and synthetic: name, appointment types, location (health station, Jorvi Hospital, HUS Heart and Lung Center, HUS Cancer Center), working days, hours.
- `GET /clinicians?type=…`, `GET /clinicians/{id}/availability?from=&to=` (free slots minus existing `appointments`).
- `POST /appointments` writes an `appointments` row `{ patient_or_contact, clinician_id, type, start, location }` and sends a simulated SMS. For a Patient with an open `pending_confirmation`, it becomes the step to confirm.
- "Book health station and X-ray" stays as a one-tap fallback that marks the call-back `booked` without the full screen.

### Contracts with the other builders

- **Provides to person 2 (companion):**
  - `GET /rules`
  - every write endpoint above that the companion calls (warning-sign tap, Check-in, Symptom Report, medication log, Confirmation)
  - `GET /demo/identities`
- **Provides to person 1 (dashboard):** nothing at runtime. The dashboard reads fixtures only.
- **Depends on person 2:** `POST /contacts`, `GET /patients/{id}` and the accessibility endpoints (person 2 owns them on this skeleton).
- **Depends on person 4:** the server-side `send_sms(to, text, subject)` and `log_fhir_sync(...)` helpers. Until they land, a local no-op with the same signature.
- **Depends on person 1:** the provider-app shell, login and demo bar.

## Testing Decisions

- Good tests check behaviour someone outside the module can see: HTTP responses and what then appears on `GET /worklist`, or the rules module's grade for given answers. They do not check how a function is built inside, which SQL runs, or private helpers.
- **Seam 1, the HTTP API.** pytest + FastAPI's test client against a throwaway schema on local Postgres (unique schema per test session, dropped afterwards). Covers:
  - `POST /contacts` → promote → `GET /patients/{id}` round-trips.
  - A fresh promoted Patient with no Confirmation, advanced seven times, fires all five rungs in order. A Confirmation on day 1 means no later rung fires.
  - A Check-in with 38,6 °C during treatment produces a red row in band 1 of `GET /worklist`, labelled "Call now".
  - A Trusted Person's Check-in grades the same as the Patient's and carries "reported by".
  - A second Symptom Report on the same symptom while the first Alert is open appends to it: still one row, two `trigger_event_ids`.
  - A "coughing up blood" tap yields a red row. Any other sign yields a call-back row.
  - Acknowledge is idempotent, and an acknowledged row stays until `mark_done`.
  - The server ignores `grade` / `rule` / `advice_shown` sent by a client.
- **Seam 2, the rules module, called directly (pure functions):**
  - two yellows → red
  - any Safety Check item → red with `call_now`, even with no symptoms
  - Own Words containing "blood" do not change a green grade
  - fever boundaries on and off treatment (37,4 / 37,5 / 37,9 / 38,0 / 38,1 / 35,9)
  - every option id in the catalogue maps to a grade
  - the stored `rules_version` equals `RULES_VERSION`
- **Seam 3, frontend components.** Vitest + Testing Library in frontend-healthcare-provider, API client mocked at the fetch boundary:
  - rows render in band order
  - a red row shows the acknowledge control and keeps it until acknowledged
  - the R7 card shows Own Words verbatim with the spoken/typed label
  - "Flag referral" calls promote
- **Prior art:** `backend/tests/` uses pytest with hermetic stubs and `tmp_path` (see `test_elevenlabs_tts.py`). Follow the same style: stub external calls, no network. There is no frontend test prior art yet. This spec and person 1's set it up for the provider app.

## Out of Scope

- Real SMS, automated calls, Suomi.fi read receipts or paper letters. All simulated through person 4's helpers (ADR-0004).
- Real scheduling: demo days only advance on "Advance one day".
- Real authentication and per-Coordinator access control. One demo Coordinator.
- The one-tap Cause Code reason on the Worklist that would feed the dashboard (plan section 4.5): design only. The dashboard's Cause Codes stay synthetic.
- Compiling a weekly structured summary for Kanta (plan section 5 steps 1–2) beyond the simulated `fhir_sync` events person 4 writes.
- Messaging between Patient and Coordinator: a separate stream, not part of the Worklist.
- Production audit logging. Acknowledgements and actions are recorded for the demo, not as a tamper-proof trail.

## Further Notes

- Grading thresholds are draft values. Check them with the mentors on Saturday (plan section 7.3, "All" row) and bump `RULES_VERSION` on any change.
- Build order:
  1. skeleton and stubs (hour 1)
  2. promote + advance-day + confirm
  3. rules module with tests
  4. Check-in and Symptom Report endpoints
  5. the Worklist merge and UI
  6. the R7 card
  7. Booking, only if time is left
- Escalation timing (0/2/3/5/7) and the paper vs digital read-status rule are plan section 4.2 drafts for clinicians to set.
