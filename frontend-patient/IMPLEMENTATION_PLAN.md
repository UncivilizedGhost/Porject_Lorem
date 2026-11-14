# Patient companion — step-by-step implementation plan

Derived from `.scratch/patient-companion/spec.md` (owner spec), `.scratch/pathway-companion/spec.md`
(data contract, API), issues 03 and 06, ADR-0002/0004/0005/0006, `docs/handoff.md`, `docs/deploy.md`,
`docs/research/on-demand-symptom-reporting.md`, `GLOSSARY.md` and the plan document.
Vocabulary follows `GLOSSARY.md` (Contact, Patient, Trusted Person, Confirmation, Check-in,
Symptom Report, Safety Check, Own Words, Alert, Escalation Step).

## Where the app stands today

| Area | State |
|---|---|
| Build, routes, proxy | Working: Vite 5173 → `/api` → `:8000`, `App.tsx` has every route. |
| `src/styles/tokens.css` | Design tokens present; text-size/contrast selectors present. |
| `src/styles/global.css` | Minimal; loads Atkinson from Google Fonts over the network. |
| `src/shell/` | Layout only. Header buttons are dead, Back is always shown, nav has no icons or active pill. |
| `src/api/client.ts` | Complete method list, `input: "voice"` wiring in place. |
| `src/api/types.ts` | Mostly `unknown`; only Symptom Report body and accessibility typed. |
| `src/lib/` | `session.ts`, `format.ts` (+ test), `usePolling.ts` done. |
| `src/components/` | `ChoiceList`, `ProgressBar`, `HelpNumbers` usable; `NumberPad` and `SlideToConfirm` stubs. |
| `src/screens/` | Every screen is `<h1>Name</h1>`. Only `questions.ts` and `machine.ts` carry real logic. |
| `src/voice/` | Person 4's no-op layer: types/contracts real, everything else `TODO`. |
| Tests | `format.test.ts` passes; `App.test.tsx` smoke; `SymptomReportFlow.test.tsx` and `matcher.test.ts` are `test.todo`. |
| `app/` | Generated static rendering of the wireframe artboards — **visual reference only** (inline styles, `app.js` navigation). Do not port its markup or JS; port the look. |

Nothing is blocked: screens can be built against person 3's 501 stubs and person 4's no-op hooks.

## Invariants that apply to every step

1. **The client never grades.** Grades, `rule`, `advice_shown`, `risk_group`, `status`, `pathway_steps` are server-derived. A Safety Check tap is the only fixed client decision (→ R2).
2. **Every write carries `actor` and `input`.** Use `actorFields()` from `lib/session.ts`; `input` is set by the API client from `voiceInputMode()`, never by a screen.
3. **One primary action per screen.** It is the only `.primary` (teal) button.
4. **Controls are real `<button>`/`<input>` with a visible label**, ≥ 48 px (primary 56 px). No gesture-only control; the slider always has its tap fallback.
5. **No phase names, no day counter, no cancer stage** on patient screens. "Demo only · day N" lives only in the demo bar.
6. **Alarm styling only for three cases**: appointment, red-flag safety check, time-critical medicine. Everything else is quiet.
7. **ISO in, Finnish out.** Dates 18.11. / 14.11.2026, times 9.30, decimals 38,6 °C — only through `lib/format.ts`.
8. **Read aloud, Aa and Help are on every screen**; Help is one tap away everywhere, including R2.
9. **UI text in English**; Finnish names, places and services in content; no drug or brand names in Medicines.
10. **No secrets in the bundle.** Voice goes through `/api/voice/*` only.

## Dependencies and how to proceed without them

| Need | From | Contract | Fallback while missing |
|---|---|---|---|
| `GET /demo/identities` | person 3 | most recent `contact_id`, `patient_id`, names | hard-code demo ids in `lib/session.ts` behind a `DEMO_IDS` constant, delete when the endpoint lands |
| `GET /contacts/{id}`, `POST /contacts` | person 3 | contact document + `risk_group` | MSW-free module mock in tests; manual seed id for the browser |
| `GET /patients/{id}` with `pathway_steps`, `status`, `next_step`, `medicines` | person 3 | shapes in owner spec | render the fixture already described in the spec (chest CT at Jorvi, 18.11. 9.30) behind one `fixtures.ts` file that is deleted at integration |
| `GET /rules` | person 3 | `safety_check_items`, `symptoms`, `other_symptom_questions`, `checkin_items`, `warning_signs` with option ids and labels | same: a local `rules.fallback.ts` shaped like the contract |
| `POST` writes | person 3 | per-endpoint response incl. `advice_shown` | resolve locally, still call the client so the seam is exercised |
| `useVoiceActions`, `useReadable`, `dictate`, `readPage` | person 4 | no-op hooks already exist with the final signatures | build screens against them as-is |
| `kanta-medicines` | person 4 | `[{ label, schedule, source }]` | empty state + chip "Kanta (FHIR mock-up)" |

Two contract gaps to raise with person 3 before Step 7: the patient view has **no display name**
(the greeting needs one; `demo/identities` can supply it), and there is **no `next_checkin_at`**
for the Check-in thank-you screen (derive from the next due date or show "next week").

## Build order

Spec order is retained; Steps 1–4 unblock everything else.

| # | Step | Screens/files | Depends on |
|---|---|---|---|
| 0 | Baseline check | — | — |
| 1 | Design foundation | `styles/*`, `index.html` | — |
| 2 | API types + data hooks | `api/types.ts`, `lib/usePolling.ts` | 1 |
| 3 | Shell wiring | `shell/*` | 1, 2 |
| 4 | Login, session, guards | `LoginScreen`, `lib/session.ts` | 2, 3 |
| 5 | Settings / accessibility | `SettingsScreen`, `lib/accessibility.tsx` | 3, 4 |
| 6 | Risk check | `RiskCheck/*` | 4, 5 |
| 7 | Warning signs | `WarningSignsScreen` | 3, 4 |
| 8 | Home | `HomeScreen` | 2, 3, 4 |
| 9 | Pathway | `PathwayScreen` | 8 |
| 10 | Confirmation + slider | `ConfirmationScreen`, `SlideToConfirm` | 8 |
| 11 | Check-in + result | `CheckIn/*`, `NumberPad` | 3, 5 |
| 12 | Symptom Report R1–R6 | `SymptomReport/*` | 3, 5, 10 |
| 13 | Medicines | `MedicinesScreen` | 3 |
| 14 | Help | `HelpScreen`, `HelpNumbers` | 1 |
| 15 | Trusted Person view | `TrustedPersonView` | 8, 10, 11, 12 |
| 16 | Care-plan card (print) | `CarePlanCard/*`, `print.css` | 8 |
| 17 | Voice registration pass | every screen | all screens |
| 18 | Tests | `*.test.tsx` | all |
| 19 | Demo rehearsal + deploy | — | all |

---

## Step 0 — Baseline

```bash
cd frontend-patient
npm ci
npm run lint        # tsc --noEmit
npm test
npm run dev         # :5173, needs the server on :8000 for data
```

Baseline observed on this scaffold (Nov 2026): `npm ci` installs, `npm run lint` exits 0,
`npm test` gives 2 passed / 2 todo (`matcher.test.ts` and `SymptomReportFlow.test.tsx`). Treat those
two todo files as the worklist for Step 18. Done when lint, tests and build are green.

## Step 1 — Design foundation

**`index.html`**: `theme-color` #f6f4f0; keep `lang="en"` as default (Settings sets it).

**`src/styles/tokens.css`** — keep the palette; add the semantic values the artboards use so no
screen hard-codes hex:

```
--border: #e2ddd5;  --chip-wait-bg: #fbefd9;  --chip-wait-ink: #7a4d00;
--chip-teal-bg: #ddeeec;  --tile-apricot: #f5e6d8;  --tile-apricot-ink: #5a3a22;
--space-1..6 (4/8/12/16/20/24px);  --radius-pill: 999px;
--focus: 3px solid #0a6670;
```

**`src/styles/global.css`**:

- Replace the Google Fonts `@import` with self-hosted `@font-face` for Atkinson Hyperlegible
  Next, copying `app/assets/fonts/atkinson-latin.woff2` and `atkinson-latin-ext.woff2` into
  `src/assets/fonts/` (`font-display: swap`). The demo must work on bad conference Wi-Fi.
- App frame: `.app-frame`/`#root` as a `min-height: 100dvh` column; `main` scrolls; bottom nav and
  demo bar fixed to the frame, `padding-bottom` for the safe area.
- Base: `button` secondary style, `.primary`, `.card`, `.chip`, `.tile`, `.field`, `.notice`,
  `.error`, `.stack`, `.muted`, `:focus-visible { outline: var(--focus); }`, `.sr-only`.
- High contrast must also raise border contrast (`--border: #000`) and remove translucent tints.
- Text size M/L/XL already switches via `data-text-size`; verify a 22 px XL screen does not clip
  the header or nav labels.

Done when a throwaway `<div className="card"><button className="primary">x</button></div>` renders
with the artboard look at M, L and XL, normal and high contrast.

## Step 2 — API types and data hooks

**`src/api/types.ts`** — replace `unknown` with the contract:

```ts
Contact { _id, county, language, consent, risk_check, warning_sign_tap, trusted_people, accessibility, promoted_patient_id }
Patient { _id, contact_id, demographics { age, language, education_group, municipality_type }, display_name?, phase,
          referral, pathway_clock, trusted_people, accessibility }
PathwayStep { id, label, location, expected_days, state: "done"|"next"|"later", date: string|null, estimated: boolean }
NextStep { kind: "appointment"|"safety_check"|"medication", what, when, where, bring[], how_to_get_there,
           pending_confirmation: { step_id, kind } | null }
PatientView { ...Patient, pathway_steps, status: "on_track"|"running_late", next_step: NextStep|null, medicines: Medicine[] }
Medicine { id, label, schedule }               // generic labels only
TrustedView { display_name, appointments, pending_confirmations, trusted_people }  // never answers
SafetyCheckItem / Symptom / GuidedQuestion / CheckinItem / WarningSign  // from GET /rules
SymptomReportResult { grade, advice_shown, rule, rules_version }
CheckinResult { grade, advice_shown, next_checkin_at? }
Identities { patient_id: string|null, contact_id: string|null, patient_name?, trusted_person_name? }
```

Type the corresponding `api.*` methods with these (no behaviour change).

**`src/lib/usePolling.ts`** — fix the fetcher-identity trap: an inline `() => api.getPatient(id)`
re-creates each render, so the effect tears down and refetches every render. Either require a stable
fetcher (`useCallback` in every caller) or change the signature to `usePolling(key, fetcher, ms)`.
Prefer the keyed signature and update the three call sites in this app; provider/dashboard pollers
are separate owners and can mirror it later.

Add `src/lib/patient.ts`: `usePatientView(id)` = keyed polling of `api.getPatient`, plus
`useRules()` (cache in module scope, one fetch per session) and `useTrustedView(id)`.

Done when a rendered Home stub logs one `GET /patients/{id}` per 4 s, not per render, and one
`demo-day-advanced` triggers an immediate refetch.

## Step 3 — Shell wiring

**`src/shell/BackButton.tsx`**

- Render only on flow routes: `/risk-check`, `/warning-signs`, `/check-in`, `/report`, `/confirm`.
  Use `useLocation()`; a `FLOW_PREFIXES` list keeps the rule in one place.
- Tab roots (`/home`, `/pathway`, `/medicines`, `/learn`, `/settings`, `/help`, `/trusted`) hide it.
- Behaviour: `navigate(-1)` when `window.history.length > 1`, otherwise the flow's root
  (`/home` for a Patient, `/warning-signs` for a Contact).
- Accessible name "Back"; 56 px target.

**`src/shell/Header.tsx`**

- Three controls, in order: **Read this page aloud** (`useVoice().readPage()`),
  **Language, text size and voice** (`Aa` → `/settings`), **Help** (`/help`, dark pill, phone icon).
- Icons inline SVG, `aria-hidden`, text label visible on "Help" and `aria-label` on icon-only ones.
- Redundant with the visible label for voice matching: the accessible name is exactly the label the
  screen registers, so `readPage` and route links stay sayable.

**`src/shell/BottomNav.tsx`**

- Four tabs with icon + label: Home, Pathway, Medicines, Learn. `NavLink` gets
  `aria-current="page"`; active tab is a filled teal pill (`--chip-teal-bg` behind the icon).
- Role-aware: for a Contact (no `patientId` in session) show **Home** (pointing at the Contact's
  landing screen, `/warning-signs`) and **Learn** only; for a Patient show all four.
  *Decision to confirm with the owner spec:* it says a Contact "gets Learn too", which reads as
  Learn in addition to a Patient-style bar; hiding Patient-only tabs is the safer reading (no dead
  links) and is what this plan assumes.
- 56 px rows, label ≥ 14 px, never icon-only.

**`src/shell/AppShell.tsx`** — order stays DemoBar · Header · main · HoldToTalkButton · BottomNav;
add the frame columns and make `main` the scroll container with `<Outlet />` inside.

**`src/shell/DemoBar.tsx`** — keep, plus: refetch `current_demo_day` on `demo-day-advanced`,
disable "Advance one day" while the call is in flight, show a short `.error` line on failure, and
`aria-live="polite"` on the status. Never gate any screen on this call succeeding.

Done when every route shows the same header, Help is one tap from each, Back appears only in
flows, and the nav pill follows the route.

## Step 4 — Login, session, guards

**`src/screens/Login/LoginScreen.tsx`**

- `<h1>Pathway Companion</h1>` + "Strong identification (mocked)" line + demo-only note
  (ADR-0004: no Suomi.fi/Omapolku branding).
- Primary: **Continue as Patient** → `GET /demo/identities`:
  - `patient_id` present → `setSession({ role: "patient", patientId })` → `/home`.
  - only `contact_id` → `setSession({ role: "patient", contactId })` → `/risk-check`.
  - neither → `/risk-check` (it creates the Contact).
- Secondary: **Continue as someone you trust** → `setSession({ role: "trusted_person",
  patientId, trustedPersonName })` → `/trusted`. If no Patient exists, show "Ask the clinic for an
  invitation" instead of a dead route.
- Failure state: `.error` "Can't reach the service. You can still use the paper card." with a
  retry; never a blank screen.

**`src/lib/session.ts`** — add `clearSession()`, `requireSession()` helpers and a `Session` guard
component (`<RequireRole role="patient">`) used in `App.tsx`; unauthenticated direct routes
redirect to `/` rather than rendering a broken screen.

**`src/App.tsx`** — wrap the shell routes in the guard (allow Contacts on `/risk-check`,
`/warning-signs`, `/learn`, `/settings`, `/help`; Patients on all; Trusted Persons on `/trusted`,
`/confirm/*`, `/report/*`, `/check-in/*`, `/help`, `/settings`).

Done when both buttons reach the right screen, storage survives a reload (sessionStorage), and a
deep link without a session lands on `/`.

## Step 5 — Settings and accessibility

New `src/lib/accessibility.tsx`:

- Context holding `{ language, read_aloud, voice_mode, text_size, high_contrast }` with defaults
  (`fi`, off, off, `m`, off).
- On mount and on change: `document.documentElement.lang = language`,
  `dataset.textSize = text_size`, `dataset.contrast = high_contrast ? "high" : ""`.
- Load from `GET /contacts|patients/{id}` once, then own the state; `save(patch)` calls
  `api.patchAccessibility(kind, id, patch)` with only the changed keys (partial update, per spec).

**`src/screens/Settings/SettingsScreen.tsx`**

- Sections: **Language** (fi / sv / en — three real radios or buttons), **Text size** (M / L / XL
  with a live preview line), **Contrast** (switch), **Read aloud** (switch), **Voice mode** (switch,
  with one plain sentence on what it does).
- Every control has a visible label and ≥ 48 px; the single primary is **Save and go back**
  (or no primary if saves are optimistic — pick optimistic save and drop the primary).
- Save errors are inline, never silent; a failed PATCH keeps the local value and shows retry.
- Reached from `Aa` and after first login when the record has no accessibility settings yet
  (one onboarding screen, "Save and continue" primary; skippable — plan section 4.3).

Done when toggling XL changes type immediately, survives navigation, and `document` attributes are
set; a PATCH is partial (only the changed key).

## Step 6 — Risk check (phase 0)

**`src/screens/RiskCheck/questions.ts`** — keep ids, fill data:

- `county`: the 5 pilot counties first (Uusimaa, Pirkanmaa, Ostrobothnia, North Ostrobothnia,
  Southwest Finland) then the other wellbeing services counties; the demo persona picks
  **Western Uusimaa**.
- `age`, `cigarettes_per_day`, `years_smoked`: `kind: "number"`, NumberPad, min/max guards
  (age 18–110, cigarettes 0–100, years 0–80).
- Branching: `smoking_status = never` skips cigarettes/years; `former` asks years only.
  Submitted values default to 0; the server computes `risk_group` (age 50–74, daily smoker,
  15+/25+ or 10+/30+, pilot county).

**`RiskCheckFlow.tsx`**

- `useReducer` over the question list: one question per screen, `ProgressBar step={i+1} total={n}`,
  Primary = Next (disabled until answered), Secondary = Back.
- Number questions: read-only display + `NumberPad` (Step 11 builds it; until then a token-styled
  numeric input is acceptable, but the final version uses the pad).
- After the last answer: **Consent screen** — "May a nurse contact you about these answers?" with
  Yes (primary) / No, plus the plain-language sentence that this is not a diagnosis. Consent must
  be given before the result (user story 13).
- Submit `POST /contacts` with
  `{ county, language, consent: { warning_sign_contact, at }, risk_check: { taken: true, at }, accessibility }`.
  Store `contactId` in the session from the response.
- Result screen: **eligible** → "You can join the lung screening pilot" + sign-up link + "Read the
  warning signs" secondary → `/warning-signs`; **not_eligible / never_smoked** → "Screening isn't
  the right route for you, but these signs matter" → primary `/warning-signs`.
  Never show the raw `risk_group` string.
- Voice: register each option as an action, number answers as `kind: "number"`, consent yes/no.

Done when the demo persona (68, former smoker, Western Uusimaa) reaches `/warning-signs` with a
persisted Contact, and a 60-year-old daily smoker with 20/day for 30 years reaches the eligible
screen. Eligibility itself is asserted by the server tests (seam 1), not here.

## Step 7 — Warning signs (phase 1)

**`WarningSignsScreen.tsx`**

- Title "Warning signs" + one-line framing ("These are worth checking. You don't need to decide
  whether it's cancer.").
- List from `GET /rules.warning_signs` (fallback order: worsening cough, hoarseness over 3 weeks,
  coughing up blood, fatigue, poor appetite) as cards, each with a 56 px **I have this** button.
- On tap: `POST /contacts/{id}/warning-sign-tap { symptom }`; disable the list, then show the
  returned advice in a `.notice`:
  - default: "A nurse will call you within 1–2 working days. If you feel worse, call 116 117."
  - coughing up blood (or any red response): red notice "Seek care today" with 116 117 / 112 and
    the Help link. Do not bury this in the list.
- If there is no Contact id (e.g. a Patient opens the screen) route them to `/help` instead of
  posting.
- Link "What happens next" → `/learn` (person 4's screen) and Help in the header.
- Readable: heading + the advice notice as `priority` when red.
- Voice: one action per sign ("I have hoarseness"), label = the sign name.

Done when a tap on hoarseness shows the call-back sentence and a tap on coughing up blood shows the
seek-care-today notice with both numbers, and both post once (no double submit).

## Step 8 — Home (phase 2–3)

**`HomeScreen.tsx`** — data from `usePatientView(patientId)`.

1. Greeting: "Good morning, Matti" (time-of-day from `lib/format` helpers; name from
   `display_name`/identities, fall back to "Good morning").
2. **Status line**, one sentence from `status`: `on_track` → "Your tests are going as planned.";
   `running_late` → "Running late — Nurse Aino knows." Amber dot for late, no red.
3. **Next-step card**: eyebrow "Your next step", `what` (24 px/700), `when` as
   `Wednesday 18.11. at 9.30`, `where` (Jorvi Hospital, Espoo). If
   `next_step.pending_confirmation` → chip "Not confirmed yet" + primary **Confirm appointment**
   → `/confirm/{step_id}`; else chip "Confirmed" + the confirmation date and no primary here.
   A collapsed **How to get there and what to bring** disclosure with: HSL route planner link,
   Kela card, Kela taxi reimbursement, Suomi.fi Messages, `bring[]`.
4. Two tiles: **Report a symptom** ("Tell Nurse Aino") → `/report`; **Call Nurse Aino**
   ("Weekdays 8–16") → `tel:` link on the apricot tile.
5. **Weekly check-in** row, only in treatment phase and when due: "Weekly check-in · 3 min" →
   `/check-in`. If part-answered, "4 of 10 answered" (client-side draft only; do not invent
   server state).
6. Pathway teaser: "Step 3 of 6 · Chest CT" → `/pathway`.

No phase label, no day counter, no diagnosis wording. Primary count: exactly one (Confirm, or
Report a symptom when nothing is pending).

Done when the fixture renders the demo card and Confirm navigates with the right `stepId`; the
"running late" fixture changes only the status line.

## Step 9 — Pathway

**`PathwayScreen.tsx`**

- Top banner: "If you need treatment, it starts within 6 weeks of your referral." plus the referral
  date and days used vs. 42 (from `pathway_clock`), plain language, no countdown anxiety.
- Vertical timeline from `pathway_steps`: done (check + date), next (teal ring + "Next" chip +
  date/time), later (hollow + "estimate" label when `estimated`). Each row: label, location,
  `expected_days` in words ("about 1 week after the referral").
- Late state: amber chip on the step that slipped, sentence "Nurse Aino has been told."
- Footer links: "Printable care-plan card" → `/care-plan-card`, "Who to call" → `/help`.
- Scroll the next step into view on mount; focus lands on the `<h1>` for screen readers.

Done when all six demo steps render in order, estimates are labelled, and the 6-week goal is present
verbatim.

## Step 10 — Confirmation and the slider

**`src/components/SlideToConfirm.tsx`** (real implementation)

- Track with a thumb; pointer events (`pointerdown/move/up`, `setPointerCapture`) plus keyboard
  (`ArrowRight` increments, `Enter`/`Space` at ≥ 90 % confirms); `role="slider"` with
  `aria-valuemin/max/now` and `aria-valuetext` ("Slide to confirm, 40 percent").
- Snap back with a short transition when released early; visible "Slide to confirm" text under the
  thumb; `prefers-reduced-motion` disables the animation.
- Keep the real `<button type="button">Or tap here to confirm</button>` beneath it — 56 px, always
  present, not `display:none` (user story 29; voice fallback too).
- `onConfirm` fires once; guard against double fire during the transition; called by both the slide
  and the button.

**`ConfirmationScreen.tsx`**

- Resolve `:stepId` against `next_step.pending_confirmation` (or the trusted view's list); if it is
  not one of the three alarm kinds, redirect rather than render an alarm.
- Content per kind: appointment → what/when/where + "Confirming stops the reminders and calls about
  this appointment."; safety check → the red-flag sentence, priority-readable, plus the numbers;
  medication → "Confirm you took your morning tablets."
- Slide + tap fallback → `api.confirm(stepId, actorFields())`.
- Success: "Confirmed. We've stopped the reminders about this." + "Back to Home" primary
  (Trusted Person → back to `/trusted`). Failure: inline error, slider re-armed, nothing lost.
- Voice: one action, `confirm_text` = "Confirm the chest CT on Tuesday at 9.30?"; the read-back
  sentence must name the thing being confirmed.

Done when both paths call the endpoint exactly once, keyboard and touch work, and the button
fallback works with the slider never touched.

## Step 11 — NumberPad, Check-in, Check-in result

**`src/components/NumberPad.tsx`**

- Digits 0–9, `,` when `allowDecimal`, backspace, and a value display (`aria-live="polite"`).
- One digit = one 56 px `<button>`; "Clear" secondary; exported `onChange` gets the string with a
  comma, converted to a number only at submit (`parseFloat(v.replace(",", "."))`).
- Used by: risk check (age, cigarettes, years) and Check-in (temperature).

**`CheckInFlow.tsx`**

- `GET /rules.checkin_items` (~10 PRO-CTCAE items): one per screen, `ProgressBar`, Primary
  **Next** (disabled until answered), Secondary **Previous** (answers preserved), title above each
  question ("Question 3 of 10").
- Answers by item id: choice items via `ChoiceList`; the temperature item via NumberPad
  (`allowDecimal`, one decimal, label "Temperature in °C"). No free text here.
- `POST /patients/{id}/checkin { answers, actor, ... }` once, on the last Next.
- Red-flag words cannot occur (tap-only); the server grades.
- Navigate with the response in location state → `/check-in/result`; on network failure show an
  inline error and keep the answers.
- Voice: read each item + options, accept the spoken option; temperature accepts a spoken number
  (`kind: "number"`).

**`CheckInResult.tsx`**

- `advice_shown = call_now` → red screen: "Call now" `<h1>`, the reason in plain words, **112** and
  **116 117** as 56 px buttons, "Nurse Aino has been told too.", Help link; `priority` readable;
  no "answer again" primary.
- otherwise → "Thank you. Nurse Aino will review this." + next Check-in date
  ("Next check-in: 21.11.") + **Back to Home** primary.

Done when a 38,6 °C answer renders the red result with both numbers, and a mild answer renders the
thank-you with a date from `lib/format.ts`.

## Step 12 — Symptom Report R1–R6

Keep `machine.ts` as the reducer; `SymptomReportFlow.tsx` owns one route and switches screens (no
child routes, so a half-finished report cannot be deep-linked into an invalid state).

- **R1 Safety Check** — the 7 "right now?" items from `rules.safety_check_items` as full-width
  buttons (never a checkbox list), with **None of these** as the single primary. The always-visible
  `.notice` (part of the screen, not dismissible): not an emergency service; a nurse replies within
  1–2 working days; 116 117 for urgent; 112 in an emergency. Any item → R2 in one tap *and* mark the
  draft ticked; the report is still submitted so the Worklist gets a red row.
- **R2 Call now** — names the tapped item (or the symptom that graded red), large 112 and 116 117
  buttons, "Nurse Aino has been told." (only after a successful submit; before submit say "When you
  finish, Nurse Aino will be told." if the report is not yet sent), Help link, priority readable.
  Reached from R1 immediately, and again after submit when the server returns `call_now`.
- **R3 Pick a symptom** — six 56 px buttons: Breathlessness, Cough or coughing blood, Pain,
  Fever or feeling unwell, Tired or not eating, Something else. One at a time, no multi-select;
  "Add another symptom" after each one; "That's everything" → R5.
- **R4 Guided questions** — for the chosen symptom, one question per screen from
  `rules.symptoms[id].questions`, tap-only `ChoiceList`, NumberPad when a question is numeric
  (temperature). Store `{ symptom, answers }`. Never grade, never hard-code thresholds; the only
  local special case is R1.
- **R5 Own Words** — optional and skippable. "Hold to speak" first (`useVoice().dictate`, then
  read-back, person 4's layer), "Type instead" second (labelled `<textarea>`). Label: "In your own
  words (optional). A nurse will read this, but not straight away." Stored as
  `{ text, source: "voice" | "typed" }`, verbatim; no keyword parsing that changes the grade.
- **Submit once** at the end of R5: `api.symptomReport(patientId, { safety_check, symptoms,
  own_words, actorFields() })`. Route on `advice_shown`: `call_now` → R2, otherwise R6.
- **R6 Sent** — what was sent (symptom names + the ticked item), "A nurse replies within 1–2
  working days", when to phone instead (116 117 out of hours, 112 in an emergency), and for
  `self_care` the short symptom-specific self-care line from the response. Primary: "Back to Home".
- Entry points: Home tile, Help, Trusted Person view; blocked below phase 2 (send to `/help`).
- Readable: R1 notice and R2 as `priority`; on R2 focus the `<h1>`.

Done when: any Safety Check item reaches R2 in one tap and the name is shown; "None of these"
reaches R3; a mocked `nurse_review` lands on R6 and a mocked `call_now` on R2; Own Words is optional
and submitted verbatim.

## Step 13 — Medicines

**`MedicinesScreen.tsx`**

- Sections by time of day (Morning / Evening) from `next_step.medicines` + `kanta-medicines` (person
  4). Each row: generic label ("Cancer medicine, tablets"), schedule ("1 tablet, morning"), and the
  three one-tap actions **Taken / Skipped / Side effect** — real buttons, 48 px, wrapping on narrow
  screens.
- After a tap: row shows "Logged 9.30" with the chosen status and the buttons disable for that dose;
  `POST /patients/{id}/medication-log { medicine_id, status, actor }`. A side-effect log shows a
  quiet line "Tell Nurse Aino if it continues" + `/report` link (never an alarm).
- Source chip at the bottom: "Medicine list: Kanta (FHIR mock-up, simulated)". No drug or brand
  names anywhere; no doses in mg.
- Empty state: "No medicines right now." + Learn link.
- Readable heading + rows; voice: taken/skipped/side effect per row (label includes the medicine
  label so matches are unambiguous).

Done when a tap logs exactly one event, the row reflects it, and a side-effect tap does not open the
alarm path.

## Step 14 — Help

**`HelpScreen.tsx`**

- `<h1>Who to call</h1>`; `<HelpNumbers />` in spec order **112 → 116 117 → Nurse Aino → Report a
  symptom**, each row a `tel:` link or a route, ≥ 56 px, urgency explained in one line.
- Treatment-phase callout, only for Patients: "During treatment, 38 °C or more means the emergency
  department." (HUS rule).
- No HUS Cancer Center as an urgent line (spec).
- Primary: **Report a symptom** (Patients only) → `/report`; for Contacts, primary is **Read the
  warning signs**.
- Readable: the 38 °C line as `priority`; voice: each number as an action ("call one one two").

Done when Help is reachable from every screen's header and the numbers are in the fixed order.

## Step 15 — Trusted Person view

**`TrustedPersonView.tsx`** — data from `useTrustedView(patientId)` (`GET /patients/{id}/trusted-view`).

- Greeting: "You are helping Matti." + "You can see appointments and confirmations. You can't see
  his answers or notes." (states the boundary once, up front).
- **Appointments**: date/time/place, status chip, and **Confirm on his behalf** when a Confirmation
  is pending → `/confirm/{stepId}` (POST then carries `actor: "trusted_person"` +
  `trusted_person_name` via `actorFields()`).
- **Pending confirmations** list with what/when and the same confirm action.
- Actions: **Weekly check-in** → `/check-in` and **Report a symptom** → `/report`; both run under the
  session's role, so all writes are logged as proxy.
- Explicitly absent: past Check-in answers, Symptom Reports, clinical notes, medicines, grades.
  Do not fetch `/patients/{id}` here — only the trusted view.
- Empty state: no patient linked → "Ask the clinic to add you as someone you trust." + Help.

Done when the view renders no clinical content, and every write it triggers carries
`actor: "trusted_person"`.

## Step 16 — Printable care-plan card

**`CarePlanCardPrint.tsx`** (`/care-plan-card`, outside the shell)

- Paper header: "My care plan", the patient's name, the date printed.
- Blocks: **What** / **When** (Finnish date + time in words) / **Where** (site + address) /
  **What to bring** (Kela card, photo ID) / **How to get there** (HSL route, Kela taxi
  reimbursement) / **My nurse** (Aino, phone, weekdays 8–16) / **If something changes** in spec
  order 112, 116 117, then the nurse.
- A **Print this card** button (`.no-print`) calling `window.print()`; everything else hidden in
  `@media print` (already partly in `print.css`).
- `@page { margin: 18mm }`, black on white, no cards/shadows, 12–14 pt, one page at A4.
- Readable + voice: "Print this card" action; heading readable.

Done when a browser print preview of a fixture yields one clean page with all seven blocks and no
demo bar or nav.

## Step 17 — Voice registration pass (person 2's side of issue 06)

`useVoiceActions` re-registers whenever the `actions` array identity changes; build every list with
`useMemo` (or change the hook to compare by a stable `actionsKey`). Same for `useReadable` objects.
Apply to every screen:

| Screen | Registered actions | Readable (heading / body / priority) |
|---|---|---|
| Login | continue as patient, continue as someone you trust | heading + demo note |
| Settings | language options, text sizes, each toggle, save | heading + current settings |
| Risk check | each option, number answers (`kind: "number"`), consent yes/no | question + hint |
| Warning signs | "I have <sign>" per sign, what happens next | heading + red advice as priority |
| Home | confirm appointment, report a symptom, call my nurse, how to get there, weekly check-in, open pathway | status line + next step |
| Pathway | printable card, who to call | 6-week goal + next step |
| Confirmation | confirm <what> (`confirm_text` names it) | what/when/where; safety text priority |
| Check-in | each option, spoken temperature, previous, next | item + options |
| Check-in result | call one one two, call one one six one one seven, back home | "Call now" text priority |
| Symptom Report | each Safety Check item, none of these, each symptom, each guided answer, add another, that's everything, dictate own words, send, back home | R1 notice / R2 priority |
| Medicines | taken / skipped / side effect per medicine | labelless list read-out |
| Help | each number, report a symptom | 38 °C line priority |
| Trusted Person | confirm on his behalf, check-in, report a symptom | boundary sentence |
| Care-plan card | print this card | card text |

Rules: labels match visible text; synonyms only for genuine spoken variants (fi/sv/en); every
`confirm_text` is a full question naming the object; no action for anything not on screen.

Done when each screen's actions appear in the VoiceProvider's registry (temporary `console.debug`
while person 4 lands) and every red/safety screen sets `priority`.

## Step 18 — Tests (seam 2, Vitest + Testing Library, API client mocked)

Un-todo and write:

1. `SymptomReportFlow.test.tsx` — any Safety Check item → Call now in one tap and names it;
   "None of these" → Pick a symptom; mocked `nurse_review` → Sent; `call_now` → Call now; Own Words
   optional and sent verbatim; only one POST.
2. `components/SlideToConfirm.test.tsx` — tap fallback calls `onConfirm` once; keyboard confirms;
   early release does not.
3. `screens/Login/LoginScreen.test.tsx` — identities with a patient → Home; contact only → risk
   check; trusted → trusted view; API failure shows the retry line.
4. `screens/RiskCheck/RiskCheckFlow.test.tsx` — one question per screen, Next disabled until
   answered, never-smoker skips cigarettes/years, consent required, POST body shape,
   non-eligible → warning signs.
5. `screens/WarningSigns/WarningSignsScreen.test.tsx` — tap posts once, call-back notice, blood
   tap shows seek-care-today.
6. `screens/Home/HomeScreen.test.tsx` — status line for both fixtures, Confirm → `/confirm/:id`,
   no phase/day text, exactly one primary.
7. `screens/CheckIn/CheckInFlow.test.tsx` + `CheckInResult` — progress, Previous preserves answers,
   38,6 submitted as 38.6, red result shows 112 and 116 117.
8. `screens/TrustedPerson/TrustedPersonView.test.tsx` — no past answers rendered; confirm sends
   `actor: "trusted_person"`.
9. `shell/AppShell.test.tsx` — Help reachable from every routed screen; Back only in flows.
10. Keep `format.test.ts`; add `formatDate` estimate wording helper if one is added.
11. `matcher.test.ts` belongs to person 4 — leave the todo in place.

Mocks: `vi.mock("../api/client")` and a router wrapper. Assert on roles/labels and on the mocked
client's calls, never on CSS or internal state.

```bash
npm run lint && npm test && npm run build
```

## Step 19 — Demo rehearsal and deploy

Follow `docs/deploy.md`: deploy the static build early with the 501 server, redeploy on each merge.

Pre-demo, by hand:

1. `GET /health` says `{"db": true}`; `POST /demo/reset`; demo day 0 everywhere.
2. Login as Patient → risk check (68, former smoker, Western Uusimaa) → not eligible → warning signs
   → tap hoarseness → call-back notice (demo step 2).
3. Advance day; referral flagged; Home shows "Not confirmed yet" (step 3).
4. Advance until the SMS/letter is unconfirmed; Help → trusted person logs in and confirms; the step
   shows Confirmed (step 3 continued).
5. Treatment: Check-in reports 38,6 °C → red "Call now" → worklist shows red (step 4).
6. Home → Report a symptom → breathlessness on stairs → yellow → R6 Sent with a 1–2 day promise
   (acceptance criterion).
7. Symptom Report → Safety Check chest pain → Call now naming it (one tap).
8. Help from three different screens; XL + high contrast on Home; Read-aloud on R2; print the
   care-plan card.
9. Phone at 375 px: no horizontal scroll, nav labels legible, slide track reachable.

## Open decisions to confirm before Step 3

- **Contact bottom bar**: Learn only, or Home + Learn (this plan assumes Home + Learn, with Home
  pointing at the warning-signs screen).
- **Greeting name**: needs `display_name` on the patient view or `GET /demo/identities`
  (contract gap; ask person 3).
- **Next check-in date**: needs `next_checkin_at` on the Check-in response (contract gap).
- **Travel/bringing details**: expandable Home card (this plan) vs. its own screen. The Home card
  keeps the artboard count and the "one primary action" rule intact.

## Out of scope (do not build here)

Real eID / Suomi.fi / Omapolku login, grading and rule logic (server), the Worklist, the Learn
answer engine, SMS/FHIR logs, Kanta Records screen and structured summary, languages beyond
fi/sv/en, push/alarm sounds, staff-led onboarding, nurse chat, provider app screens.
