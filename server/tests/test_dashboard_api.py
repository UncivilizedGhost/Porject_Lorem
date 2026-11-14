"""Person 1, seam 2 (HTTP, fixtures seeded). See .scratch/equity-dashboard/spec.md.

- GET /dashboard/counties returns 22 incl. Western Uusimaa
- an n < 5 cell comes back suppressed with no value
- POST /dashboard/summary with the model stubbed (one cited + one uncited sentence) keeps only
  the cited one and never puts a suppressed fact in the prompt
- model stubbed to time out → source: "cached"
- decision with blank reason → 422; a valid one is first in GET /dashboard/decisions
"""

import pytest

from app.fixtures.seed import ensure_fixtures

CARD = "western-uusimaa/missed-first-visits-75"


@pytest.fixture(scope="module", autouse=True)
async def _seeded():
    await ensure_fixtures()


async def test_counties_lists_all_22_including_western_uusimaa(client):
    r = await client.get("/dashboard/counties")
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert len(names) == 22
    assert "Western Uusimaa" in names
