# Visual port — from `app/` artboards to the React app

`app/` is a generated static rendering of the wireframe artboards: 18 HTML files sharing
`assets/app.css` + a 390 × 844 phone frame. It is a **visual reference only**. We port the look
(fonts, spacing, colour, control sizes, copy) into the React app; we do not port its markup,
inline styles or `assets/app.js` navigation. Every screen stays a real component with real
semantics (`<button>`, `<Link>`, `<h1>`), and data still comes from the API.

Scope of this document: matching the artboards screen for screen, with Home as the first step.
The behavioural work (data, validation, tests) stays in `IMPLEMENTATION_PLAN.md`; the two meet
where an artboard already shows the final design.

## Three layers

1. **Foundation** — `styles/tokens.css` + `styles/global.css`: self-hosted Atkinson Hyperlegible
   Next, the palette as named tokens, and the primitives every artboard uses (`.card`, `.tile`,
   `.chip`, `.primary`, `.eyebrow`, `.notice`, `.app-frame`). No screen hard-codes a hex value.
2. **Shell** — `AppShell` (phone frame + DemoBar + Header + scrolling `main` + BottomNav),
   `Header` (back · read aloud · Aa · Help), `BottomNav` (four tabs, active teal pill).
3. **Screens** — one component per artboard, same copy and hierarchy, wired to the API.

## Foundational decisions (taken from `app/assets/app.css`)

| Artboard | App |
|---|---|
| `body` background `#e9e6df`, centred `.app-frame` 390 × 844, radius 26, soft shadow | `.app-frame` in `AppShell`; at ≤ 480 px wide or ≤ 900 px tall it becomes full-bleed `100dvh` |
| Frame scrolls as a whole | Frame is a fixed-height flex column; `main` is the only scroll container, nav stays pinned |
| Font loaded from `assets/fonts/*.woff2` | Same files copied to `src/assets/fonts/`, `@font-face` in `global.css` (no Google Fonts request — demo Wi-Fi) |
| Type scale 30 / 24 / 20 / 19 / 17 / 15 / 14 px, weights 400/600/700 | Expressed as tokens + component classes, scaled by `data-text-size` |
| Teal `#0a6670` for actions only, apricot `#f5e6d8` for people, amber chip for waiting, red only for urgent | Tokens `--teal`, `--apricot`, `--chip-wait-*`, `--red`; red never used decoratively |
| Every tap target ≥ 44–48 px, primary 56 px | `--target-min` / `--target-primary`; enforced in the base `button`/`.primary` rules |

## Screen map

| Artboard | Route | Component | Status |
|---|---|---|---|
| `index.html` (demo login) | `/` | `Login/LoginScreen` | pending |
| `risk-check.html` | `/risk-check` | `RiskCheck/RiskCheckFlow` | pending |
| `warning-signs.html` | `/warning-signs` | `WarningSigns/WarningSignsScreen` | pending |
| **`home.html`** | `/home` | `Home/HomeScreen` | **done in this step** |
| `timeline.html` | `/pathway` | `Pathway/PathwayScreen` | pending |
| `confirm.html` | `/confirm/:stepId` | `Confirmation/ConfirmationScreen` | pending |
| `check-in.html` | `/check-in` | `CheckIn/CheckInFlow` | pending |
| `voice-checkin.html` | `/check-in` (voice mode) | `CheckIn/*` + `HoldToTalkButton` | pending |
| `risk-check.html` (result) | `/risk-check` (last step) | `RiskCheck/*` | pending |
| `report-pick.html` | `/report` | `SymptomReport/R3PickSymptom` | pending |
| `report-question.html` | `/report` | `SymptomReport/R4GuidedQuestion` | pending |
| `report-words.html` | `/report` | `SymptomReport/R5OwnWords` | pending |
| `report-sent.html` | `/report` | `SymptomReport/R6Sent` | pending |
| `report-urgent.html` | `/report` | `SymptomReport/R2CallNow` | pending |
| `medication.html` | `/medicines` | `Medicines/MedicinesScreen` | pending |
| `learn.html` | `/learn` | `Learn/LearnScreen` | pending |
| `help.html` | `/help` | `Help/HelpScreen` | pending |
| `accessibility.html` | `/settings` | `Settings/SettingsScreen` | pending |
| `support-person.html` | `/trusted` | `TrustedPerson/TrustedPersonView` | pending |

## Step 1 — foundation + shell + Home (this change)

**Foundation**

- Copy `app/assets/fonts/atkinson-latin.woff2` and `atkinson-latin-ext.woff2` to
  `src/assets/fonts/`; replace the Google Fonts `@import` with three `@font-face` blocks
  (400/600/700, `font-display: swap`).
- `tokens.css`: keep the palette, add `--border`, `--chip-wait-bg/ink`, `--chip-teal-bg`,
  `--tile-apricot(-ink)`, `--space-1..6`, `--radius-pill`, `--radius-tile`, `--focus`,
  `--shadow-frame`. High contrast also darkens `--border` and removes tints.
- `global.css`: `.app-frame`, `.card`, `.tile`, `.chip`, `.eyebrow`, `.primary`, `.icon-button`,
  `.header-actions`, `.bottom-nav`, `.row-link`, plus the existing flow primitives
  (`.choice-list`, `.number-pad-*`, `.slide-*`, `.timeline`, `.help-numbers`, `.notice`).

**Shell**

- `AppShell`: `.app-frame` column — DemoBar · Header · `<main>` (scrolls) · hold-to-talk slot ·
  BottomNav.
- `Header`: 56 px back slot on flow routes only; read-aloud 48 px circular icon button;
  `Aa` 48 px pill → `/settings`; dark `Help` pill with phone icon → `/help`.
- `BottomNav`: inline SVG icons (house, timeline, capsule, book), 14 px labels, active tab gets a
  teal-tinted pill behind the icon and `aria-current="page"`.

**Home** (`home.html`)

1. `h1` "Good morning, Matti" — time of day + `display_name`, falling back to "Good morning".
2. Status line under it (`on_track` / `running_late`, amber dot, one sentence, no red).
3. Next-step card: teal eyebrow "Your next step", 24 px title, `Wednesday 18.11. at 9.30`,
   place in secondary ink, "How to get there and what to bring" disclosure, then the confirmation
   chip ("Not confirmed yet" / "Confirmed") and the single teal **Confirm appointment**.
4. Two 128 px tiles: **Report a symptom** (white, teal border) and **Call Nurse Aino** (apricot,
   `tel:` link).
5. Weekly check-in row → `/check-in`.

## Deviations from the artboards (deliberate)

- **Back arrow** is absent on tab roots (`/home`, `/pathway`, `/medicines`, `/learn`, `/help`,
  `/settings`): the artboard's arrow links to the screen it is already on. It appears on the flow
  screens where it does something.
- **Status line** under the greeting is in the spec but not the artboard; it is rendered quietly
  (small, secondary ink) so the greeting still reads first.
- **Demo bar** stays above the header: demo-only, not patient-facing content.
- **Pathway teaser** is omitted from Home — the artboard does not have it and the bottom nav
  already links to Pathway. If the spec insists, it becomes a second `.row-link` under the
  check-in row.
- No "4 of 10 answered" on the check-in row until the client has a real draft count; it shows
  "3 min" only.

## Remaining steps (one artboard group at a time)

2. Login (demo role tiles) + risk check (one question per screen, NumberPad, consent, result).
3. Warning signs (card list + 56 px "I have this").
4. Pathway timeline (done / next / later, 6-week banner).
5. Confirmation (red/alarm variant, slider + tap fallback).
6. Check-in + voice check-in + result screens.
7. Symptom report R1–R6 (pick, guided question, own words, sent, urgent).
8. Medicines, Learn, Help, Settings (`accessibility.html`), Trusted Person.
9. Care-plan print card.
10. Visual regression pass: every artboard at 375 px, M/L/XL text and high contrast.

## Rules for every screen

- Tokens only; no hex values in components.
- One primary action per screen; it is the only filled teal control.
- Real `<button>` / `<Link>` / `<input>` with a visible or `aria-label` name, ≥ 48 px (primary 56).
- Icons are inline SVG, `aria-hidden`; the text or the `aria-label` carries the name.
- Copy comes from the artboard; dates/times still go through `lib/format.ts`.
- Voice labels and `useReadable` heading/body/priority are registered on every screen.
