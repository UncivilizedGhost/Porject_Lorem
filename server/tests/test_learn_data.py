"""Learn reference data (passages, credible sources, pregenerated answers) is served from the
database, seeded from the fixture files, and falls back to the files when the database cannot
answer. Seams: the corpus module, POST /demo/reset, GET /health."""

from app import db
from app.services.learn import corpus


def _passage(id: str, url: str, language: str = "en") -> dict:
    return {"id": id, "language": language, "title": "t", "text": "x", "source_label": "s", "url": url}


async def test_passages_are_served_from_the_database(fresh_db):
    await db.upsert("learn_passages", "db-only", _passage("db-only", "https://www.who.int/some-page"))
    await db.upsert("credible_sources", "who.int", {"domain": "who.int"})

    await corpus.refresh()

    assert "db-only" in [p["id"] for p in corpus.passages("en")]


async def test_seeding_fills_the_tables_and_the_files_win(fresh_db):
    from app.fixtures.seed import ensure_seeded

    await db.truncate(db.REFERENCE_TABLES)
    await ensure_seeded()
    await db.upsert("learn_passages", "ct_en", _passage("ct_en", "https://www.who.int/tampered"))
    await ensure_seeded()

    await corpus.refresh()

    ct = next(p for p in corpus.passages("en") if p["id"] == "ct_en")
    assert ct["url"] != "https://www.who.int/tampered"
    assert len(corpus.load_all()) > 10
    assert len(await db.find("credible_sources")) > 0
    assert len(await db.find("learn_answers")) > 0


async def test_learn_falls_back_to_the_files_when_the_database_cannot_answer(fresh_db, monkeypatch):
    async def broken(*_a, **_k):
        raise ConnectionError("database asleep")

    monkeypatch.setattr(db, "find", broken)

    await corpus.refresh()

    assert "ct_en" in [p["id"] for p in corpus.passages("en")]


async def test_demo_reset_keeps_the_learn_reference_data(fresh_db, client):
    await db.upsert("learn_passages", "keep-me", _passage("keep-me", "https://www.who.int/x"))

    assert (await client.post("/demo/reset")).status_code == 200

    assert await db.get("learn_passages", "keep-me") is not None
    assert len(await db.find("credible_sources")) > 0


async def test_health_reports_learn_row_counts(fresh_db, client):
    from app.fixtures.seed import ensure_seeded

    await db.truncate(db.REFERENCE_TABLES)
    await ensure_seeded()

    body = (await client.get("/health")).json()

    assert body["learn"]["learn_passages"] == 24
    assert body["learn"]["credible_sources"] > 0
    assert body["learn"]["learn_answers"] == 18
