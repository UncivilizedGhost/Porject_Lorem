"""Derived blocks for `GET /patients/{id}` and the trusted view. Owner: person 2.

pathway_steps: ordered steps from fixtures/pathway_template.json with done | next | later and
a date or estimated date, derived from phase + pathway_clock (+ appointments if Booking exists).
status: on_track | running_late (current step past its expected day, or any Escalation Step
fired and unconfirmed).
next_step: what / when / where / what to bring + pending_confirmation { id, kind }.
medicines: fixtures/medicines.json (generic labels, no drug names).
trusted_view: the same minus clinical content; never events, Check-in or Symptom Report answers.
"""
