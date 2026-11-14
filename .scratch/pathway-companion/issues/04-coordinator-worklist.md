Status: ready-for-human

# Coordinator worklist + alert/escalation rules

Owner: person 3 (plan section 7.3). Covers plan section 4.4 and the escalation ladder in 4.2.

## Tasks

1. Alert rule engine: on `POST /patients/{id}/checkin` and on warning-sign taps, grade red/yellow/green per the table in plan section 4.4 (red flags list, moderate-symptom/missed-dose/no-confirmation thresholds, mild/stable). Write to `alerts`. A "coughing up blood" warning-sign tap grades red, not yellow, even for a Contact (agreed 14 Nov). Check-ins and Symptom Reports submitted by a Trusted Person grade the same way; show "reported by [name], trusted person" on the row.
2. Escalation ladder: the 5 rungs are created at promotion time (owned by issue 01); this role owns what happens when a rung actually fires (`fired_at` set by `/demo/advance-day`) — surfacing it on the worklist and, for digital vs. paper read-status, applying the rule from plan section 4.2 ("unopened after 48h" vs. "only an SMS reply or answered call counts").
3. Build `/worklist`: merge `alerts` (from Check-ins, Symptom Reports and red warning-sign taps) + fired, unconfirmed `escalation_steps` + call-back-pending contacts into one sorted list (red alerts, then warning-sign call-backs, then overdue confirmations, then yellow alerts and trends), one-line reason per row, delivery status, pathway clock per person, one-tap actions (call, book health station visit + X-ray, flag referral, rebook, mark handled, hand to trusted person; "Flag referral" on a call-back row calls `POST /contacts/{id}/promote` and is how the demo starts the Pathway Clock), workload line (alerts per shift, false-alarm share — can be a static/derived count for the demo).
4. `POST /alerts/{id}/acknowledge` for the red-alert "must acknowledge" requirement.
5. Use the spec's "Finnish context" section for row text and actions: "Book health station and X-ray" rather than "GP", delivery status in terms of Suomi.fi Messages, text message and automated call, and Finnish time and decimal formats (10.42, 38,6 °C).
6. Symptom Report rules (ADR-0006, research file §3.2–3.5): one versioned rules module (`RULES_VERSION`) that both the companion's question screens and `POST /patients/{id}/symptom-report` read from.
   - Safety Check items: any ticked → red, `advice_shown: "call_now"`.
   - Per-symptom questions and option → grade maps for the 5 symptoms. Fever: 38 °C or more (or below 36 °C, or generally unwell) on treatment → red; 37.5–37.9 → yellow. Not on treatment: above 38.0 with feeling unwell → red; 37.5–38.0 → yellow.
   - "Something else": PRO-CTCAE severity + interference + new/worse → grade.
   - Combine: worst wins; two or more yellows → red. Store `rule` as a readable string.
   - Own Words never change the grade.
   - Write the `symptom_report` event, then create an Alert (`source: "symptom_report"`), or append to an open Alert for the same Patient and symptom.
7. Worklist card for a Symptom Report (wireframe R7):
   - grade and the rule that set it, plus `rules_version`
   - structured answers
   - Own Words verbatim on their own tinted block, labelled spoken or typed
   - the advice the patient saw
   - waiting time against the 1–2 working-day promise
   - Actions: Call, Assign to me, Record action taken, Mark done.
   - Sort: red, then yellow, then green; oldest first within each.

## Acceptance

- A fired red Alert shows as "Call now" on `/worklist` within one poll interval of the companion app's check-in that created it.
- Matches demo script step 4 (plan section 7.2).
- Rules unit tests: two yellows give red; any Safety Check item gives red; Own Words text containing "blood" does not change a green grade (it is shown, not parsed).
- A second report on the same symptom while the first Alert is open adds to that Alert instead of creating a new row.
