"""Person 2, seam 1 (HTTP). See .scratch/patient-companion/spec.md → Testing Decisions.

- risk-check eligibility at the boundaries (age 49/50/74/75, 15 vs 16 cigarettes for 25 vs 26
  years, 10/30, former smoker, never smoked, non-pilot county)
- POST /contacts → promote → GET /patients/{id} carries copied accessibility and Trusted People
- pathway_steps and status change after advance-day
- trusted-view never contains Check-in or Symptom Report answers
- the accessibility PATCH is partial
"""
