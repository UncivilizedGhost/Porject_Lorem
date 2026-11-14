Status: ready-for-agent

# Patient companion web app (person 2)

Part of the Cancer Pathway Companion build: umbrella spec `.scratch/pathway-companion/spec.md` (data contract, Finnish context, decisions agreed 14 Nov). Absorbs issue 03 in full, the Contact, Patient and accessibility parts of issue 01, the patient-app login and demo bar, and the screen-side wiring of issue 06 (each screen registers its voice actions; person 4 builds the voice layer itself). Domain terms: `GLOSSARY.md`. Decisions: ADR-0002 (promotion), ADR-0004 (fake login), ADR-0005 (voice on on-screen actions only), ADR-0006 (Symptom Report rules). Research: `docs/research/on-demand-symptom-reporting.md`.

Wireframes: https://claude.ai/artifact/87qpPWJkCW8y2XQvaEX4EA. Artboards:

- "0 · Demo login"
- "1 · Risk check (phase 0)"
- "2 · Warning signs (phase 1)"
- "3 · Home (phase 2)"
- "4 · Pathway timeline"
- "5 · Alarm-style confirmation"
- "6 · Trusted-person view"
- "7 · Symptom check-in (phase 3)"
- "8 · Medication"
- "10 · Accessibility settings"
- "12 · Who to call (Help, every screen)"
- "R1 · Safety check first" to "R6 · Sent (yellow / green)"
- "Printable care-plan card"

Also the canvas notes n0–n8, nh, r1–r6 and the teal design-system note ("ds"). "9 · Learn" and "11 · Voice Mode (check-in)" are person 4's screens inside this app.

Demo-script steps this spec must carry (plan section 7.2): 2 (risk check → warning-sign tap), 3 (Trusted Person confirms on the Patient's behalf), 4 (Check-in reports fever → "Call now").

## Problem Statement

A 68-year-old former smoker in Western Uusimaa doesn't know whether his hoarseness matters, isn't eligible for the screening pilot, and has no way to tell anyone short of booking a health-station visit he keeps putting off. Once he is referred, the Pathway is a stream of letters, phone calls and appointments at different HUS sites. He has no single place that says what happens next, where to go, what to bring and who his nurse is. When a letter goes unanswered, nobody follows up until the time limit is already lost. When he gets a fever during treatment, he doesn't know whether to phone 116 117, wait for his nurse or ignore it. His daughter wants to help but has no sanctioned way to confirm an appointment or report a symptom for him. Small text, dense screens and typing all shut him out further.

## Solution

A phone web app, with no app-store install, that follows the person from risk check to first treatment, so nothing restarts between Phases. As a Contact (phase 0–1) they can:

- take an opt-in risk check against the national screening pilot's criteria
- learn the warning signs, and tap "I have this" to get a nurse call-back

Once a Referral promotes them to Patient (phase 2–3), Home always shows:

- one status line
- the next step with one primary action
- Nurse Aino's card
- a way to report a symptom

Pathway shows the 6-week goal and the steps done and coming. The three things that really matter (an appointment, a red-flag safety check, a time-critical medicine) use an alarm-style slide-to-confirm with a button fallback. Everything else is quiet. During treatment there is a weekly Check-in and one-tap medication logging. Something new between Check-ins goes through a Symptom Report: a Safety Check first, then guided questions, then optional Own Words.

A Trusted Person logs into the same app, sees appointments and confirmations (never clinical notes), and can confirm, check in and report symptoms on the Patient's behalf, all logged as proxy. Every screen has Read aloud, text size and Help one tap away, uses Finnish services and formats, and is built so person 4's Voice Mode can drive every action.

## User Stories

### Login and shell

1. As a demo presenter, I want a neutral "strong identification (mocked)" login with Patient and Trusted Person buttons, so that I can enter the right view without real eID (ADR-0004).
2. As a demo presenter, I want the demo bar (current demo day, "Advance one day") on top of every screen, clearly labelled demo-only, so that I can move the clock from inside the companion.
3. As any companion user, I want Read aloud, Aa and Help in the header of every screen, so that the tools I need are always in the same place.
4. As any companion user, I want Back on every flow screen, so that I can always undo a step.
5. As any companion user, I want a bottom bar with icon and label for Home, Pathway, Medicines and Learn, with the active tab as a filled pill, so that I always know where I am.
6. As a Contact, I want the bottom bar to give me Learn too, so that I can read about tests before I'm referred.
7. As any companion user, I want text at least 17 px, buttons at least 48 px (primary 56 px) and the Atkinson Hyperlegible Next typeface, so that I can read and tap comfortably with poor eyesight or shaky hands.
8. As any companion user, I want no phase names and no day counter on my screens, so that I'm not confronted with clinical labels or a countdown.

### Help

9. As any companion user, I want Help one tap away on every screen, so that I can always find out who to call.
10. As any companion user, I want Help to list 112, then 116 117, then Nurse Aino (weekdays 8–16), then Report a symptom, ranked by urgency, so that I pick the right number.
11. As a Patient in treatment, I want Help to say that 38 °C or more means the emergency department, so that I don't wait with a fever.

### Risk check (phase 0)

12. As a Contact, I want an opt-in risk check with one question per screen (age, wellbeing county, smoking status, cigarettes a day, years smoked), so that it doesn't feel like a form.
13. As a Contact, I want to give consent to be contacted before seeing my result, so that I control whether a nurse calls me.
14. As an eligible Contact, I want my result on its own screen with a link to the screening pilot's sign-up, so that I can join it.
15. As a non-eligible Contact (e.g. a former smoker), I want to be sent to the warning signs instead, so that I'm still covered.
16. As a Contact, I want to answer with taps and a number pad, never required typing, so that the check is easy.

### Warning signs (phase 1)

17. As a Contact, I want the Pirkanmaa warning signs (worsening cough, hoarseness over 3 weeks, coughing up blood, fatigue, poor appetite) listed plainly, so that I know what to watch for.
18. As a Contact, I want one tap "I have this" on a sign, so that I can raise it without explaining myself.
19. As a Contact, I want to be told that a nurse will call within 1–2 working days after a tap, so that I know what happens next.
20. As a Contact who taps "coughing up blood", I want to be told to seek care today with the right numbers, so that I don't wait.

### Home and Pathway (phase 2–3)

21. As a Patient, I want a greeting and one status line ("Your tests are going as planned", or "Running late, Nurse Aino knows"), so that I know at a glance whether to worry.
22. As a Patient, I want a next-step card saying what, when (18.11., 9.30), where (e.g. Jorvi Hospital, Espoo) and one primary action (Confirm appointment), so that I always know my next move.
23. As a Patient, I want a "How to get there and what to bring" link with HSL directions, the Kela card, Kela taxi reimbursement and Suomi.fi Messages, so that practical worries are answered.
24. As a Patient, I want Nurse Aino's card with a call button, so that I can reach my named nurse.
25. As a Patient, I want a "Report a symptom" button on Home, so that I can report something new between appointments.
26. As a Patient, I want the Pathway screen to show the 6-week goal ("if you need treatment, it starts within 6 weeks of your referral"), so that I know what I'm entitled to.
27. As a Patient, I want Pathway to list steps done and coming (health station and X-ray, HUS lung clinic Referral, chest CT at Jorvi, bronchoscopy at the HUS Heart and Lung Center, treatment plan, first treatment at the HUS Cancer Center), with future dates marked as estimates, so that I can see the whole road.

### Confirmation

28. As a Patient, I want an alarm-style slide-to-confirm only for an appointment, a red-flag safety check and a time-critical medicine, so that alarms keep their meaning.
29. As a Patient who can't slide, I want "Or tap here to confirm" under every slider, so that I can still confirm.
30. As a Patient, I want my Confirmation to stop reminders and calls about that step, so that I'm not chased for something I've done.

### Check-in and medication (phase 3)

31. As a Patient in treatment, I want a weekly Check-in of about 10 PRO-CTCAE items, one per screen with a progress bar and Previous/Next, so that it's manageable.
32. As a Patient, I want to enter my temperature on a big number pad, so that I don't need to type.
33. As a Patient whose Check-in grades red (e.g. fever 38,6 °C), I want a "Call now" screen with 116 117 and 112 straight away, so that I act at once.
34. As a Patient, I want my medicines listed without drug or brand names, with taken / skipped / side effect in one tap, so that logging is quick and private.

### Symptom Report (R1–R6)

35. As a Patient (phase 2 onward), I want "Report a symptom" from Home, Help and the trusted-person view, so that I can find it wherever I am.
36. As a Patient, I want a Safety Check of seven "right now?" items first, with "None of these" as the main button, so that a danger sign never waits in a queue and the common case is one tap.
37. As a Patient, I want an always-visible note that this is not an emergency service, the reply comes within 1–2 working days, and 116 117 / 112 are for urgent help, so that I'm not misled.
38. As a Patient who taps any Safety Check item, I want to reach "Call now" in one tap, naming the item I chose, with big 112 and 116 117 buttons and a note that Nurse Aino was told too, so that I act myself.
39. As a Patient, I want to pick one symptom at a time (breathlessness, cough or blood, pain, fever or unwell, tired or not eating, something else), so that I never manage a multi-select.
40. As a Patient, I want "Add another symptom" after each one, so that I can report several things.
41. As a Patient, I want guided questions one per screen with tap-only answers, so that I never have to type.
42. As a Patient, I want to add my Own Words, by "Hold to speak" or "type instead", read back before saving, so that I can say what the questions missed.
43. As a Patient, I want the Sent screen to say what was sent, that a nurse replies within 1–2 working days, and when to phone instead of waiting, so that I know my next move.
44. As a Patient with a green result, I want short self-care advice for that symptom, so that I know what to do meanwhile.
45. As a Patient whose guided answers grade red, I want "Call now" instead of Sent, so that I'm not told to wait.

### Trusted Person

46. As a Trusted Person, I want to log in to the same app as "someone you trust", so that I don't need a separate tool.
47. As a Trusted Person, I want to see the Patient's appointments and pending Confirmations, so that I can help them keep the Pathway on time.
48. As a Trusted Person, I want to confirm on the Patient's behalf, so that an unanswered text message doesn't escalate when I've already sorted it.
49. As a Trusted Person, I want to submit a Check-in or Symptom Report for the Patient, so that I can report what I see.
50. As a Patient, I want everything my Trusted Person does logged as proxy and shown to the nurse with their name, so that it's transparent.
51. As a Patient, I want my Trusted Person never to see clinical notes, including my past Check-in and Symptom Report answers, so that my privacy is kept.

### Settings, accessibility, paper

52. As any companion user, I want to choose Finnish, Swedish or English, so that I read in my language.
53. As any companion user, I want text size (M, L, XL), high contrast, Read-aloud and Voice Mode toggles in onboarding and behind "Aa", so that I set things up once.
54. As any companion user, I want my settings saved on my record, so that they follow me after promotion.
55. As a Patient, I want a printable care-plan card of my next step, so that paper is an equal channel, not a fallback.
56. As a Voice Mode user, I want every button on every screen to be something I can say, so that I can use the whole app hands-free (person 4's voice layer reads the actions I register).

## Implementation Decisions

### App and stack

- `frontend-patient/` becomes a React + Vite app. The existing static `care-companion.html` predates the wireframe and is superseded. Keep it out of the build or delete it, and don't port its look.
- Routes:
  - login
  - risk check (a flow)
  - warning signs
  - Home
  - Pathway
  - Confirmation (opened from Home and the trusted-person view)
  - Check-in (a flow)
  - Medicines
  - Learn (person 4's screen)
  - settings
  - Help
  - Symptom Report (a flow R1–R6)
  - trusted-person view
  - the care-plan card print view
- One small API client module wraps fetch, so tests can mock at that boundary.
- Design tokens from the canvas's design-system note go into one CSS-variables file, used everywhere:
  - ground #f6f4f0, ink #1d2a2e, secondary #4b575b
  - teal #0a6670 for actions only, apricot #f5e6d8 for people, amber for waiting, red #b02a20 for urgent only
  - 17/15 px type, headings 700
  - targets ≥ 48 px, primary 56 px
  - radius 14 (buttons) / 20 (cards)
  - text-size and high-contrast settings switch these variables.
- Shared shell component: demo bar, then the header (Read aloud · Aa · Help, plus Back on flow screens), then content, then the hold-to-talk slot (person 4's component, shown when Voice Mode is on), then the bottom bar.
- Formatting helpers for Finnish dates (18.11. / 14.11.2026), times (9.30) and decimals (38,6 °C). Values from the server are ISO and formatted only here.

### Login and demo identity

- Patient → calls `GET /demo/identities` (person 3). If no Contact exists, it starts the risk check, which creates one. A promoted Contact routes to Home as the Patient.
- Trusted Person → the trusted-person view for the most recent Patient.
- The chosen role and id live in local state (session storage is fine). No backend auth call.
- Demo bar: shows `current_demo_day` (read from `GET /health` or the advance response) and calls `POST /demo/advance-day`, then refetches the current screen's data.

### Endpoints owned here (on person 3's server skeleton)

- `POST /contacts`:
  - Body: `county`, `language`, `consent`, `risk_check { taken, risk_group }`, optional `trusted_people`, `accessibility`.
  - `risk_group` is computed server-side from the risk-check answers, using the pilot criteria: age 50–74; smokes daily now; > 15 cigarettes a day for > 25 years or > 10 a day for > 30 years; lives in Uusimaa (which includes Western Uusimaa), Pirkanmaa, Ostrobothnia, North Ostrobothnia or Southwest Finland.
  - Values: `screening_pilot_eligible`, `not_eligible`, `never_smoked`.
  - Returns the Contact and `risk_group`.
- `GET /contacts/{id}` returns the Contact (for Contacts that are not yet promoted).
- `GET /patients/{id}` returns the Patient plus two derived blocks, so the screens never compute pathway logic:
  - `pathway_steps`: the demo pathway's ordered steps from a small read-only template (step id, label, location, expected days from the Pirkanmaa pathway, `done` | `next` | `later`, date or estimated date). Derived from `phase` + `pathway_clock` and, if person 3's booking stretch exists, `appointments`.
  - `status`: `on_track` | `running_late`. Running late = the current step is past its expected day, or any Escalation Step has fired unconfirmed.
  - `next_step`: what / when / where / what to bring, plus `pending_confirmation` (the open `escalation_steps` id and kind: appointment | safety_check | medication).
  - `medicines`: a short fixture list of generic labels with no drug names (e.g. "Cancer medicine, tablets, morning").
- `GET /patients/{id}/trusted-view` returns the same minus clinical content: appointments, pending Confirmations and the trusted people. It never includes `events` payloads, Check-in or Symptom Report answers.
- `PATCH /contacts/{id}/accessibility` and `PATCH /patients/{id}/accessibility`: partial update of `{ read_aloud, voice_mode, text_size, high_contrast }`. Language is patched alongside, on the top-level `language` field.

### Endpoints this app calls (owned by person 3)

- `GET /rules`
- `POST /contacts/{id}/warning-sign-tap`
- `POST /escalation-steps/{id}/confirm`
- `POST /patients/{id}/checkin`
- `POST /patients/{id}/symptom-report`
- `POST /patients/{id}/medication-log`

Every write sends:

- `actor`: `self`, or `trusted_person` plus `trusted_person_name` in the trusted-person view
- `input`: `touch`, or `voice` when person 4's voice layer submitted it

### Symptom Report flow

- A client-side state machine:
  - R1 Safety Check: any item → R2; "None of these" → R3.
  - R3 Pick a symptom → R4 guided questions, one per screen.
  - After each symptom, "Anything else?" → R3, or → R5.
  - R5 Own Words: optional, skippable → submit.
  - The result decides the last screen: R2 for `call_now`, R6 for `nurse_review` or `self_care`.
  - "Something else" from R3 goes through its three PRO-CTCAE questions, then to R5.
- Questions, option ids, labels and Safety Check items all come from `GET /rules`. The screens never grade. A Safety Check tap goes to R2 straight away on the client (fixed behaviour, not grading). The full report is still submitted with the ticked item, so the Worklist gets a red row.
- One submit at the end. The R2/R6 screen is chosen from the returned `advice_shown`.
- Own Words: "Hold to speak" uses person 4's speech-to-text and read-back; "type instead" is a plain textarea. Stored as `{ text, source }`.
- The always-visible notice on R1 (not an emergency service, reply within 1–2 working days, 116 117 / 112) is part of the screen, not a dismissible banner.

### Check-in flow

- ~10 items from `GET /rules`, one per screen, with a progress bar and Previous/Next. Temperature uses a number pad.
- Submit → `call_now` shows the Check-in red screen ("Call now", 116 117, 112, Nurse Aino told). Otherwise a short thank-you with the next Check-in date.

### Confirmation

- A slide-to-confirm component (pointer events, keyboard-operable) with a real `<button>` "Or tap here to confirm" under it.
- Used only for the three alarm-style cases. Confirms through `POST /escalation-steps/{id}/confirm`.

### Voice and Read-aloud wiring (contract with person 4)

- Every screen registers its actions with person 4's voice layer as `{ id, label, synonyms, confirm_text, run }`. `confirm_text` is the read-back sentence, e.g. "Confirm the chest CT on Tuesday at 9.30?". `run` is the same handler the button calls.
- Each screen marks its readable content (heading, main text, and any red/safety message flagged as priority) so Read-aloud can read it on arrival and on "Read this page".
- Rules for every control:
  - real `<button>` / `<input>` with a visible label
  - one primary action per screen
  - no gesture-only control
- Until person 4's layer lands, a no-op registration hook with the same signature, so screens never wait on it.

### Printable care-plan card

- A print-stylesheet view of the next-step card:
  - what / when / where
  - what to bring (Kela card)
  - how to get there
  - Nurse Aino and the help numbers in spec order: 112, 116 117, Nurse Aino
- The HUS Cancer Center is not listed as an urgent line.

### Finnish content

Follow the umbrella's "Finnish context" for every screen:

- health station (terveysasema) and the HUS sites per step
- Suomi.fi Messages, Kanta (medicines are a FHIR mock-up from person 4), Kela card and taxi reimbursement, HSL directions
- Finnish demo names
- UI text in English for the judges

## Testing Decisions

- Good tests drive the app the way a person does (find by role and label, click, type) and check what is on screen or what was sent to the API client. They do not check internal component state, CSS classes or hook internals.
- **Seam 1, the HTTP API.** pytest + FastAPI's test client against a throwaway local Postgres schema (shared fixture with person 3). Covers:
  - risk-check eligibility at the boundaries: age 49/50/74/75, 15 vs 16 cigarettes for 25 vs 26 years, 10/30, former smoker, never smoked, non-pilot county
  - `POST /contacts` → promote → `GET /patients/{id}` carries copied accessibility and Trusted People
  - `pathway_steps` and `status` change after `advance-day`
  - `trusted-view` never contains Check-in or Symptom Report answers
  - the accessibility PATCH is partial
- **Seam 2, frontend components.** Vitest + Testing Library in frontend-patient, with the API client module mocked. Covers:
  - tapping any Safety Check item reaches "Call now" in one tap and names the item
  - "None of these" goes to Pick a symptom
  - a report graded `nurse_review` lands on Sent, `call_now` on Call now
  - the slider's "Or tap here to confirm" button calls confirm
  - Help is reachable from every routed screen's header
  - the trusted-person view sends `actor: "trusted_person"` and shows no past answers
  - Finnish formatting helpers (38,6; 9.30; 18.11.)
- **The demo walkthrough** (risk check → tap → … → fever) is the end-to-end check, run by hand against the real server before the demo.
- **Prior art:** the pytest style in `backend/tests/`. There is no frontend test prior art yet. This app sets up Vitest + Testing Library.

## Out of Scope

- Real eID, Suomi.fi or Omapolku login and branding (ADR-0004).
- Grading logic and the Worklist (person 3). The Learn screen, the voice layer, SMS/FHIR logs (person 4).
- Records screen and the Kanta structured summary (plan section 4.3 "Records" row, section 5).
- Languages beyond Finnish, Swedish and English in the selector. UI copy stays English for the demo. Full translation is not required.
- Push notifications, alarm sounds or OS-level critical alerts.
- Onboarding done by staff or a hotline (plan section 4.3).
- Messaging or chat with the nurse.

## Further Notes

- Confirm the screening pilot criteria against the pilot's own sign-up page before the demo (sources disagree slightly, see issue 03 task 1). The demo persona (68, former smoker) is not eligible and goes the warning-sign route.
- The HUS route per step is plausible, not confirmed. Check with a mentor.
- Build order:
  1. shell + tokens + login + demo bar
  2. Home / Pathway against person 3's stubs
  3. risk check + warning signs
  4. Confirmation + trusted-person view
  5. Check-in
  6. Symptom Report
  7. Medicines, settings, care-plan card
