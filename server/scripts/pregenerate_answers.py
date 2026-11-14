"""Answer the Learn suggested questions and write the Insight Card summaries ahead of time.

The shared Nemotron endpoint takes about a minute per call under load, far past
NEMOTRON_TIMEOUT_S, so the demo serves these instead of calling the model live.

    cd server && python -m scripts.pregenerate_answers            # both
    cd server && python -m scripts.pregenerate_answers learn      # Learn only
    cd server && python -m scripts.pregenerate_answers summary    # Insight Cards only (needs the database)

Writes app/fixtures/learn_answers.json and app/fixtures/pregenerated_summaries.json; commit
both after reading them. Rerun after editing the corpus, the suggested questions or a card.
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

from app import config, db
from app.services import learn, nemotron, summary_facts
from app.services.learn import pregenerated, red_flags, retrieval
from app.services.summary_filter import filter_sentences

LEARN_SCREEN = config.REPO_ROOT / "frontend-patient" / "src" / "screens" / "Learn" / "LearnScreen.tsx"
FIXTURES = Path(__file__).resolve().parents[1] / "app" / "fixtures"
SUMMARIES_PATH = FIXTURES / "pregenerated_summaries.json"
TIMEOUT_S = 300
PARALLEL = 6


def suggested_questions() -> dict[str, list[str]]:
    """The SUGGESTED block of LearnScreen.tsx, so the questions have one source of truth."""
    source = LEARN_SCREEN.read_text(encoding="utf-8")
    block = re.search(r"const SUGGESTED[^=]*=\s*\{(.*?)\n\};", source, re.S)
    if not block:
        raise SystemExit(f"SUGGESTED not found in {LEARN_SCREEN}")
    out = {}
    for lang, items in re.findall(r"(\w+):\s*\[(.*?)\]", block.group(1), re.S):
        out[lang] = re.findall(r'"((?:[^"\\]|\\.)*)"', items)
    return out


def _write(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


async def pregenerate_learn() -> None:
    gate = asyncio.Semaphore(PARALLEL)
    stamp = datetime.now(UTC).isoformat(timespec="seconds")

    async def one(question: str, language: str) -> dict | None:
        if red_flags.contains_red_flag(question, language):
            print(f"  skip (red flag, fixed safety text): [{language}] {question}")
            return None
        passages = retrieval.search(question, language)
        if not passages:
            print(f"  skip (no credible passage): [{language}] {question}")
            return None
        system, user = learn.build_prompt(question, language, passages)
        async with gate:
            started = datetime.now(UTC)
            try:
                text = (await nemotron.complete(system, user, timeout_s=TIMEOUT_S)).strip()
            except Exception as exc:  # noqa: BLE001 - report and carry on with the other questions
                print(f"  FAILED [{language}] {question}: {type(exc).__name__} {exc}")
                return None
        took = (datetime.now(UTC) - started).total_seconds()
        print(f"  ok {took:5.0f}s [{language}] {question}")
        return {
            "question": question,
            "language": language,
            "passage_ids": [p["id"] for p in passages],
            "text": text,
            "model": config.NEMOTRON_MODEL,
            "generated_at": stamp,
        }

    jobs = [one(q, lang) for lang, qs in suggested_questions().items() for q in qs]
    print(f"Learn: {len(jobs)} suggested questions, {PARALLEL} at a time")
    entries = [e for e in await asyncio.gather(*jobs) if e]
    _write(pregenerated.ANSWERS_PATH, entries)
    print(f"Learn: wrote {len(entries)} answers to {pregenerated.ANSWERS_PATH.name}")


async def pregenerate_summaries() -> None:
    from app.fixtures.seed import county_id, ensure_seeded
    from app.routers.dashboard import _card_with_matches

    await db.init_schema()
    await ensure_seeded()
    cards = json.loads((FIXTURES / "insight_cards.json").read_text(encoding="utf-8"))
    out: dict[str, list[dict]] = {}
    for card_doc in cards:
        card, matched = await _card_with_matches(card_doc["_id"])
        county = await db.get("counties", county_id(card["where"]))
        facts = summary_facts.build_facts(card, county, matched)
        print(f"Summary: {card['_id']} ({len(facts)} facts)")
        try:
            reply = await nemotron.complete(
                summary_facts.SYSTEM_PROMPT, summary_facts.build_prompt(facts), timeout_s=TIMEOUT_S
            )
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED: {type(exc).__name__} {exc}")
            continue
        sentences = filter_sentences(reply, {f["id"] for f in facts})
        print(f"  kept {len(sentences)} cited sentences")
        if sentences:
            out[card["_id"]] = sentences
    await db.close_pool()
    _write(SUMMARIES_PATH, out)
    print(f"Summary: wrote {len(out)} cards to {SUMMARIES_PATH.name}")


async def main(which: str) -> None:
    if not (config.NEMOTRON_BASE_URL and config.NEMOTRON_MODEL and config.nemotron_key()):
        raise SystemExit("Nemotron is not configured: set NEMOTRON_BASE_URL, NEMOTRON_MODEL and the key")
    if which in ("both", "learn"):
        await pregenerate_learn()
    if which in ("both", "summary"):
        await pregenerate_summaries()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "both"))
