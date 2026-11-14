"""Person 1, seam 2 (HTTP, fixtures seeded). See .scratch/equity-dashboard/spec.md.

- GET /dashboard/counties returns 22 incl. Western Uusimaa
- an n < 5 cell comes back suppressed with no value
- POST /dashboard/summary with the model stubbed (one cited + one uncited sentence) keeps only
  the cited one and never puts a suppressed fact in the prompt
- model stubbed to time out → source: "cached"
- decision with blank reason → 422; a valid one is first in GET /dashboard/decisions
"""
