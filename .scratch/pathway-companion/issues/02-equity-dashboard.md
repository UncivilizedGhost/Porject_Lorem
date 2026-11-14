Status: ready-for-human

# Equity dashboard

Owner: person 1 (plan section 7.3). Covers plan section 4.5.

## Tasks

1. Hand-author the `counties` fixture: 22 documents, one per wellbeing services county plus Helsinki, with real names and synthetic figures, each with its `tile` position from the wireframe. The demo county is Western Uusimaa: put it below Norway's 70% line. Have some counties above Sweden's 80% and some below 70%, and tune `reach_rate_over_75` so the over-75 equity gap is visually obvious. Also fill `days_per_phase`, `pct_outside_fast_track`, `causes` (per-stage Cause Code shares) and an `n` on every breakdown cell. Seed at least one cell under 5 (e.g. Swedish-speaking over-75s in a small county) so suppression shows in the demo. Seed via a one-off script or directly into Postgres — this fixture is never written to at runtime.
2. Hand-author the `actions` fixture (the Action Library): the five rows of plan section 4.5's table, each with roadmap action, evidence links, badge, the lever it acts on and its effect range (`null` for Nordic-policy actions). Verify the study design of [43] before the build: if it isn't a trial, its badge becomes "Single-site project".
3. Build level 1 at `/dashboard`: 3 numbers (% within target with Norway 70% / Sweden 80% lines, median days referral-to-treatment, reach rate among over-75s) and 1 tile map of Finland (one tile per county, coloured in bands: under 60%, 60–69%, 70–79% meets Norway, 80%+ meets Sweden; Western Uusimaa outlined). Footer carries the evidence caveat from plan section 4.5 with [28]. Include the shared demo bar from issue 01.
4. Build level 2 at `/dashboard/county/:name` (clicking a tile): 1 pathway bar (days per phase, coloured where exceeded), equity breakdown (age/language/education/municipality type), share outside the fast-track. Cells with `n < 5` show "not enough data"; `n < 20` show a small-sample warning.
5. Build one Insight Card for Western Uusimaa at `/dashboard/county/:name/insight/missed-first-visits-75`: what/where/who, Cause Codes, and two Matched Actions side by side — reminders + nurse call (simulated) and named coordinator 1.2.3 ("No effect estimate: not simulated").
6. Simulation on the card: one dial per simulated action, bounded to its effect range, labelled "assumed effect in Finland", published value marked. Calls `POST /dashboard/simulate` and renders days saved and extra people within target as ranges, plus "needed to reach 70% / 80%" beside "evidence shows". Pure function over the fixtures, no persistence; overlapping levers take the larger single effect, never the sum.
7. AI summary on the card via `POST /dashboard/summary`: the server builds a list of facts with ids from the fixtures, asks the Nemotron endpoint used by Learn (issue 05; URL and key from `.env` / `.secrets`) for a short summary with fact ids on every sentence, drops any sentence without a valid id, and renders the ids as links to the number or source. Facts from suppressed cells are never sent. If the endpoint fails or times out, return a pre-written cached summary for this card.
8. Decision step on the card: Approve / Adapt / Reject, required reason, owner and due date → `POST /dashboard/decisions`, writing an append-only `decisions` row with a snapshot of the numbers and badges shown. Show the card's Decision Log below it (`GET /dashboard/decisions?card_id=...`).
9. Label every number as synthetic, per plan section 9 / the demo script's own framing ("Numbers synthetic and labelled"). This matters more now that county names are real: a synthetic label must sit on the 3 numbers, the map, the equity breakdown, the Cause Codes and the simulation, not only once on the page.

## Out of scope for the build (design only, plan section 4.5)

AI question answering, briefing notes, before/after tracking, Insight Cards other than the Western Uusimaa one, the Worklist reason tap that would produce real Cause Codes.

## Acceptance

- Opens on the 3 numbers + map within 2 minutes of looking at it cold (plan's own bar: "Clear in 2 minutes").
- Every AI sentence on the card links to a fact; a sentence without one never renders.
- No simulated output is a single point; the not-evaluated action shows no number.
- A decision without a reason can't be submitted, and appears in the Decision Log after submit.
- Matches the demo script's steps 1 and 6 (plan section 7.2).
