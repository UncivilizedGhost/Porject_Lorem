Status: ready-for-human

# Equity dashboard

Owner: person 1 (plan section 7.3). Covers plan section 4.5.

## Tasks

1. Hand-author the `counties` fixture: 22 documents, one per wellbeing services county plus Helsinki, with real names and synthetic figures, each with its `tile` position from the wireframe. The demo county is Western Uusimaa: put it below Norway's 70% line. Have some counties above Sweden's 80% and some below 70%, and tune `reach_rate_over_75` so the over-75 equity gap is visually obvious. Seed via a one-off script or directly into Mongo — this fixture is never written to at runtime.
2. Build `/dashboard`: 3 numbers (% within target with benchmark lines, median days referral-to-treatment, reach rate among over-75s), 1 tile map of Finland (one tile per county, coloured in bands: under 60%, 60–69%, 70–79% meets Norway, 80%+ meets Sweden; Western Uusimaa outlined), 1 pathway bar (days per phase, coloured where exceeded), equity breakdown (age/language/education/municipality type), 3 recommended actions pulled straight from plan section 4.5's table (static text + evidence links is fine). Include the shared demo bar from issue 01.
3. Build the simulation: 3 sliders ("warning signs acted on X days sooner", "missed visits reduced by Y%", "coordinator reaches Z% of silent patients") that call `POST /dashboard/simulate` and render days-saved / extra-people-within-target. This endpoint is a pure function over the fixture numbers — no persistence.
4. Label every number as synthetic, per plan section 9 / the demo script's own framing ("Numbers synthetic and labelled"). This matters more now that county names are real: a synthetic label must sit on the 3 numbers, the map and the equity breakdown, not only once on the page.

## Acceptance

- Opens on the 3 numbers + map within 2 minutes of looking at it cold (plan's own bar: "Clear in 2 minutes").
- Matches the demo script's steps 1 and 6 (plan section 7.2).
