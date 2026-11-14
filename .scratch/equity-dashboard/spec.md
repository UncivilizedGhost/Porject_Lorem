Status: ready-for-agent

# Equity Dashboard and provider-app shell (person 1)

Part of the Cancer Pathway Companion build: umbrella spec `.scratch/pathway-companion/spec.md` (data contract for `counties`, `actions`, `decisions`, decisions agreed 14 Nov). Absorbs issue 02 in full, plus the provider app's login screen, demo bar and shell from issue 01. Domain terms: `GLOSSARY.md` (County, Insight Card, Action Library, Matched Action, Cause Code, Decision Log). Source: plan section 4.5. Decisions: ADR-0001, ADR-0004.

Wireframes: https://claude.ai/artifact/87qpPWJkCW8y2XQvaEX4EA. Artboards:

- "Equity dashboard · 1 National overview"
- "Equity dashboard · 2 Pathway view (Western Uusimaa)"
- "Equity dashboard · 3 Insight Card"
- "0 · Demo login" (Coordinator and County viewer buttons)
- the canvas notes "nd" and "ni", and the green "Dashboard decisions agreed 14 Nov (grilling)" note

Demo-script steps this spec must carry (plan section 7.2): 1 (Western Uusimaa: over-75s start treatment late, days lost before Referral and before the first visit) and 6 (the Western Uusimaa Insight Card: cited AI summary, Matched Actions compared with days-saved ranges, a recorded decision).

## Problem Statement

Ministry, FICAN and county leaders know Finland has a 6-week target from Referral to treatment, but can't see quickly whether people are treated in time, where the days are lost, or who is left behind. The existing figures are national averages that hide the over-75s, the Swedish speakers and the rural municipalities who start treatment late. When a gap is visible, the people who must act get either a raw number or an opaque "AI recommendation". They have nothing that ties the gap to national roadmap actions with an honest evidence grade, no way to compare options with realistic ranges, and no record of who decided what, on which numbers.

## Solution

A three-level decision-support dashboard, each level one click deeper, with every figure labelled synthetic:

1. **National overview.** Three numbers (% starting treatment within target with Norway's 70% and Sweden's 80% lines, median days from Referral to treatment, reach rate among over-75s) and a tile map of all 21 wellbeing services counties plus Helsinki, coloured by the same %.
2. **County pathway view.** Days per phase, coloured where exceeded, an equity breakdown by age, language, education group and municipality type with small cells suppressed or flagged, and the share of lung cancers diagnosed outside the fast-track.
3. **The Insight Card for Western Uusimaa** (missed first visits among over-75s):
   - what, where and who, plus the Cause Codes
   - a plain-language AI summary where every sentence links to a fact
   - two Matched Actions side by side, with evidence badges and simulated effect ranges against the 70% / 80% gap
   - the human decision, with reason, owner and due date, written to an append-only Decision Log

The system matches; a person decides.

This spec also builds the provider app's shell (fake login, demo bar, routing) that the Worklist (person 3) mounts into.

## User Stories

### Provider app shell

1. As a demo presenter, I want a neutral "strong identification (mocked)" login with Coordinator and County viewer buttons, so that I can enter the Worklist or the Dashboard without real eID.
2. As a demo presenter, I want the demo bar (current demo day, "Advance one day", labelled demo-only) on every provider-app screen, so that the clock can be moved from any view.
3. As the Worklist builder, I want a shell with routing and the demo bar that I can add my routes to, so that I don't build a second shell.

### Level 1: national overview

4. As a ministry official, I want to see the % of Patients starting treatment within the target time, so that I know whether the national goal is met.
5. As a ministry official, I want Norway's 70% and Sweden's 80% shown as lines against that %, so that I can judge Finland against Nordic benchmarks.
6. As a ministry official, I want the median days from Referral to treatment, so that I see the typical wait.
7. As a ministry official, I want the reach rate among over-75s, so that I see whether older people are left behind.
8. As a ministry official, I want a tile map of all 21 wellbeing services counties plus Helsinki, real names, coloured in bands (under 60%, 60–69%, 70–79% meets Norway, 80%+ meets Sweden), so that I spot lagging Counties at a glance.
9. As a viewer, I want the bands to differ in lightness, not only hue, and to have a legend, so that I can read the map with colour-vision deficiency.
10. As a viewer, I want Western Uusimaa outlined on the map, so that the demo County is easy to find.
11. As a viewer, I want to click a County tile to open its pathway view, so that I can drill down.
12. As a viewer, I want the evidence caveat in the footer ("Evidence linking time-to-treatment and lung cancer survival is mixed [28]; this dashboard targets equal access and adherence to the national time limit."), so that I don't over-read the numbers.
13. As a viewer, I want every number, the map, the breakdown, the Cause Codes and the simulation labelled synthetic, so that nobody mistakes demo figures for real county data.
14. As a first-time viewer, I want to understand the overview within 2 minutes, so that the dashboard is usable cold.

### Level 2: County pathway view

15. As a County leader, I want a pathway bar of days per phase (detection, Referral, diagnosis, treatment), coloured where the stage warning is exceeded, so that I see where days are lost.
16. As a County leader, I want the equity breakdown by age group, language, education group and municipality type, each with % within target, so that I see who is left behind.
17. As a County leader, I want cells under 5 people to show "not enough data", so that nobody is identifiable and no false conclusion is drawn.
18. As a County leader, I want cells under 20 people to carry a small-sample warning, so that I treat them with caution.
19. As a County leader, I want the share of lung cancers diagnosed outside the fast-track (no suspected-cancer Referral), so that I see how many Pathways never had a clock running.
20. As a County leader, I want a link from the gap to its Insight Card, so that I can move from "where" to "what to do".
21. As a viewer, I want a way back to the national overview, so that I can compare Counties.

### Level 3: Insight Card

22. As a decision-maker, I want the card to state what (missed first visits), where (Western Uusimaa) and who (over-75s), so that the gap is unambiguous.
23. As a decision-maker, I want the Cause Codes for the stage (unconfirmed, transport, waiting for a slot) as shares, so that I see why days are lost.
24. As a decision-maker, I want a short plain-language AI summary of the card, so that I get the picture fast.
25. As a decision-maker, I want every summary sentence to link to the number or source it comes from, so that I can check every claim.
26. As a decision-maker, I want sentences without a valid fact never to appear, so that the summary can't invent things.
27. As a decision-maker, I want facts from suppressed cells never sent to the model, so that small groups stay protected in the AI text too.
28. As a decision-maker, I want a pre-written cached summary when the AI endpoint fails, so that the card still works during the demo.
29. As a decision-maker, I want two Matched Actions side by side (phone/SMS reminders + nurse call when not confirmed; named coordinator for every patient, roadmap 1.2.3), so that I compare options rather than tune percentages.
30. As a decision-maker, I want each Matched Action to show its roadmap action, its evidence links and one of four evidence badges (Trial / review, Registry evaluation, Nordic national policy (not evaluated), Single-site project), so that I see how strong the evidence is.
31. As a decision-maker, I want one dial per simulated action, bounded to its effect range, labelled "assumed effect in Finland", with the published value marked, so that I can explore only what the evidence supports.
32. As a decision-maker, I want days saved and extra people within target shown as ranges, never single points, so that the uncertainty is visible.
33. As a decision-maker, I want "needed to reach 70% / 80%" beside "evidence shows", so that I know whether an action can close the gap at all.
34. As a decision-maker, I want a Nordic-policy action to say "No effect estimate: not simulated" and show no number, so that no effect size is invented.
35. As a decision-maker, I want two actions on the same lever to count the larger single effect, not the sum, so that the simulation doesn't double count.
36. As a decision-maker, I want the word "Matched", never "Recommended", so that it's clear the system matches and I decide.

### Decision and Decision Log

37. As a decision-maker, I want to record Approve, Adapt or Reject for the card's Matched Actions, so that the decision is explicit.
38. As a decision-maker, I want a reason to be required, so that every decision is explained.
39. As a decision-maker, I want to set an owner (e.g. County coordinator team) and a due date, so that someone is accountable.
40. As a decision-maker, I want the decision to store a snapshot of the facts, simulation and badges I saw, so that it can be judged later on what was known then.
41. As a decision-maker, I want the card's Decision Log listed under it, newest first, so that I see what was decided before.
42. As an auditor, I want the Decision Log to be append-only, so that a decision can't be quietly changed.

## Implementation Decisions

### Provider app (frontend-healthcare-provider)

- New React + Vite app in `frontend-healthcare-provider/`. Routes:
  - the login screen
  - the Dashboard at level 1, `county/:name` at level 2, `county/:name/insight/:cardSlug` at level 3
  - person 3's Worklist routes
  - person 4's SMS / FHIR log route
- Login: two buttons, Coordinator → Worklist, County viewer → Dashboard. The role is kept in local state. No backend call except `GET /demo/identities` (person 3) to get the Coordinator id.
- Demo bar component on every route: day from `GET /health` or the last advance response, button → `POST /demo/advance-day`. It emits a refresh event that pages may listen to.
- One API client module wrapping fetch, so tests mock at that boundary.
- Visual design: a desktop page (1280–1440 wide) that still stacks at phone width. Dashboard tokens are separate from the patient design system. Charts follow the `dataviz` skill (validated palette, lightness-distinct bands, labelled axes).

### Fixtures (seeded once, never written at runtime)

- `counties`: 22 documents per the umbrella data contract. Real names, synthetic figures, `tile { col, row }` from the wireframe's tile map. Tuning requirements:
  - Western Uusimaa below Norway's 70%.
  - Some Counties at or above 80%, some below 70%.
  - `reach_rate_over_75` low enough in Western Uusimaa that the over-75 gap is obvious.
  - `days_per_phase` with Western Uusimaa losing days before Referral and before the first visit.
  - `pct_outside_fast_track`, and `causes` per phase as Cause Code shares.
  - An `n` on every breakdown cell, with at least one cell under 5 (e.g. Swedish-speaking over-75s in a small County) and some under 20.
- `actions`: the five rows of plan section 4.5's Action Library table:
  - `gap_pattern`, `roadmap_action`, `evidence` (ref, label, url), `badge`, `lever`
  - `effect` with `published`, `low`, `high`, `range_rule`: the CI where published, else half to full; `null` for Nordic-policy actions
  - Verify [43]'s study design first: if it is not a trial or review, its badge becomes `single_site`.
- Plus one hand-authored Insight Card definition for `western-uusimaa/missed-first-visits-75`: what / where / who, stage, the target group's baseline % within target and n, and the cached fallback summary with fact ids.
- A seed script loads all three idempotently (upsert by name / id). It runs at server start if the tables are empty, or on demand.
- Stage warning thresholds for colouring the pathway bar (per phase, from the Pirkanmaa pathway) live with the fixture.

### Endpoints owned here (on person 3's server skeleton)

- `GET /dashboard/counties`: all 22 for level 1 (name, tile, the three numbers). `GET /dashboard/counties/{name}`: the full document for level 2. Suppression is applied server-side: `n < 5` cells come back as `{ suppressed: true }` with no value, and `n < 20` carries `small_sample: true`.
- `GET /dashboard/actions`: the Action Library. `GET /dashboard/insight/{card_id}`: the card definition plus its Matched Actions (actions whose `gap_pattern` matches the card's phase, cause and group; no ranking).
- `POST /dashboard/simulate`:
  - Body: `{ card_id, dials: { <action_id>: number } }`.
  - Returns:
    - per action: `simulated: bool`, `assumed_effect`, `days_saved { low, high }`, `extra_within_target { low, high }`
    - combined: `pct_within_target { low, high }`, `lever_rule_applied`
    - target gap: `needed_for_70`, `needed_for_80`, `reachable_70`, `reachable_80`, and the max achievable even at full effect
  - A pure function over fixtures, no DB write.
- `POST /dashboard/summary`:
  - Body: `{ card_id }`.
  - Builds a fact list `[{ id, text, value, source_url? }]` from the card, County and actions, skipping suppressed cells.
  - Prompts the Nemotron endpoint (the same provider person 4 uses for Learn; URL and key from `.env` / `.secrets/verda_inference_key`) to write ≤ 4 sentences, each ending with fact ids in brackets.
  - Splits the reply into sentences and drops any sentence without at least one valid id.
  - Returns `{ sentences: [{ text, fact_ids }], facts, source: "live" | "cached" }`.
  - A timeout (~8 s) or error → the card's cached summary, `source: "cached"`.
- `POST /dashboard/decisions`:
  - Body: `{ card_id, action_ids, verdict, reason, owner, due, decided_by, snapshot }`.
  - Rejects with 422 when `reason` is blank or `verdict` is not one of approve / adapt / reject.
  - Sets `demo_day` from `clock_state`. Insert only: no update or delete endpoint exists.
- `GET /dashboard/decisions?card_id=…`: newest first.

### Simulation module

A pure module, the decision-rich core:

- **Inputs:** the card baseline (group n, % within target, missed-visit share, days lost to missed visits), each selected action's `effect` and `lever`, and a dial value per action.
- **Dial bounds:** clamped to `[low, high]`, default `published`. The dial is the "assumed effect in Finland".
- **Ranges:** results are computed at the range ends (low, high), so output is always a range. The dial value shows as a marker inside it.
- **Same lever:** actions on the same `lever` use the larger single effect, never the sum, and the response says which action set it.
- **No effect:** actions with `effect: null` return `simulated: false` and no numbers.
- **Target gap:** the effect needed to reach 70% and 80%. When it is beyond `high` (or beyond 100% of the lever), the response says the action can't close the gap and gives the best achievable %. Example from plan 4.5: "even none missed gives 58%".

### Summary sentence filter

A pure function: model reply + valid fact ids → kept sentences with their parsed ids. Unknown ids count as missing. The UI renders each id as a link to the number on the card (anchor) or to the evidence URL.

### UI behaviour

- Level 1 opens with the three numbers above the map.
- "Synthetic" badges on each number, the map legend, the breakdown table, the Cause Codes and the simulation panel.
- Level 2 links to the Insight Card from the over-75 / missed-first-visit gap.
- Level 3 order:
  1. what / where / who
  2. Cause Codes
  3. AI summary
  4. Matched Actions side by side, each with badge, roadmap and evidence links, and the dial or "No effect estimate: not simulated"
  5. results panel: ranges and "needed vs evidence shows"
  6. decision form
  7. Decision Log
- Dials re-call `POST /dashboard/simulate`, debounced.
- The decision form builds `snapshot` from what is currently rendered (facts shown, last simulation response, badges).

### Contracts with the other builders

- **Depends on person 3:** the server skeleton, models area, `clock_state`, `GET /demo/identities`, `POST /demo/advance-day`.
- **Depends on person 4:** none at runtime. Share the Nemotron client settings (endpoint, key loading). Whoever lands first owns the small shared client, and the other reuses it.
- **Provides to person 3 and person 4:** the provider-app shell, login, demo bar and route registration.

## Testing Decisions

- Good tests check behaviour someone outside the module can see: API responses and what renders. They don't check internal maths helpers or component state.
- **Seam 1, pure modules, called directly.** Simulation:
  - no output is a single point (low < high whenever an effect exists)
  - a dial outside the bounds is clamped
  - two actions on the same lever give the larger single effect, not the sum
  - a `null`-effect action returns `simulated: false` and no numbers
  - "needed for 70%" beyond the range reports "can't close the gap" with the best achievable %

  Summary filter:
  - a sentence without an id is dropped
  - a sentence with an unknown id is dropped
  - a sentence with a valid id is kept with its ids
- **Seam 2, the HTTP API.** pytest + FastAPI's test client against a throwaway local Postgres schema with the fixtures seeded:
  - `GET /dashboard/counties` returns 22, including Western Uusimaa
  - a County's `n < 5` cell comes back suppressed with no value
  - `POST /dashboard/summary` with the model stubbed to return one cited and one uncited sentence returns only the cited one, and never includes a suppressed fact in the prompt it built
  - with the model stubbed to time out, it returns `source: "cached"`
  - a decision with a blank reason → 422; a valid one appears first in `GET /dashboard/decisions`
- **Seam 3, frontend components.** Vitest + Testing Library in frontend-healthcare-provider, API client mocked:
  - map tiles get the right band for 59 / 60 / 69 / 70 / 79 / 80
  - a suppressed cell renders "not enough data"
  - the decision submit is disabled or errors without a reason
  - a Nordic-policy action renders "No effect estimate: not simulated" and no number
  - "Synthetic" labels are present on each required section
- **Prior art:** `backend/tests/` pytest style with hermetic stubs (see `test_elevenlabs_tts.py` for stubbing an external client). There is no frontend test prior art yet. This spec and person 3's set up Vitest in the provider app.

## Out of Scope

- AI question answering, briefing notes and before/after tracking (design only, plan section 4.5).
- Insight Cards other than Western Uusimaa / missed first visits among over-75s.
- Real Cause Codes from the Worklist reason tap. Cause Codes stay synthetic in the fixture.
- Any patient-level data on the dashboard. A statistically generated synthetic cohort. Runtime writes to `counties` or `actions`.
- Production auth or a tamper-proof audit trail. The Decision Log demonstrates the idea.
- Survival claims. The caveat with [28] appears once, on the overview.

## Further Notes

- Roadmap numbers are written as in the plan (e.g. 1.2.3, 2.5.2, 3.1.2). The plan's simulation example ("over-75s in Western Uusimaa can't reach 70% through fewer missed visits alone (even none missed gives 58%); evidence shows 21–43% fewer") is a good tuning target for the fixture.
- Build order:
  1. shell + login + demo bar (person 3 needs it early)
  2. fixtures + seed
  3. level 1
  4. level 2
  5. Insight Card static
  6. simulation
  7. decisions
  8. AI summary with cached fallback first, then live
