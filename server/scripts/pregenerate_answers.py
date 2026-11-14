"""Answer the Learn suggested questions and write the Insight Card summaries ahead of time.

The shared Nemotron endpoint takes about a minute per call under load, far past
NEMOTRON_TIMEOUT_S, so the demo serves these instead of calling the model live.

    cd server && python -m scripts.pregenerate_answers            # both
    cd server && python -m scripts.pregenerate_answers learn      # Learn only
    cd server && python -m scripts.pregenerate_answers summary    # Insight Cards only (needs the database)

Writes app/fixtures/learn_answers.json and app/fixtures/pregenerated_summaries.json; commit
both after reading them. Rerun after editing the corpus, the suggested questions, the counties or the Action Library.
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
ATTEMPTS = 4


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
    from app.fixtures.seed import COORDINATOR_COUNTY, ensure_seeded
    from app.routers.dashboard import _group_card

    await db.init_schema()
    await ensure_seeded()
    # One card per unsuppressed breakdown group of the demo county.
    county = next(c for c in await db.find("counties") if c["name"] == COORDINATOR_COUNTY)
    groups = [
        (dimension, group)
        for dimension, cells in county["breakdown"].items()
        for group, cell in cells.items()
        if not cell.get("suppressed") and cell["n"] >= summary_facts.SUPPRESS_BELOW
    ]
    gate = asyncio.Semaphore(PARALLEL)
    previous = json.loads(SUMMARIES_PATH.read_text(encoding="utf-8")) if SUMMARIES_PATH.is_file() else {}

    async def one(dimension: str, group: str) -> tuple[str, list[dict]] | None:
        card, _, recommended = await _group_card(county["name"], dimension, group)
        facts = summary_facts.build_facts(card, county, recommended)
        # A card is kept only when it states the group's share and how it compares with the county
        # in checked wording; otherwise the endpoint builds the summary from the facts by rule.
        for attempt in range(1, ATTEMPTS + 1):
            async with gate:
                try:
                    reply = await nemotron.complete(
                        summary_facts.SYSTEM_PROMPT, summary_facts.build_prompt(facts), timeout_s=TIMEOUT_S
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"  FAILED {card['card_id']}: {type(exc).__name__} {exc}")
                    continue
            sentences = summary_facts.precise_sentences(filter_sentences(reply, {f["id"] for f in facts}), facts)
            cited = {i for s in sentences for i in s["fact_ids"]}
            if len(sentences) >= 3 and {"group_pct", "group_vs_county"} <= cited:
                print(f"  {card['card_id']}: kept {len(sentences)} checked sentences (attempt {attempt})")
                return card["card_id"], sentences
        # The last run's text stays if it still passes the same checks against today's facts.
        earlier = previous.get(card["card_id"], [])
        if earlier and summary_facts.precise_sentences(earlier, facts) == earlier:
            print(f"  {card['card_id']}: no checked summary after {ATTEMPTS} attempts, kept the previous one")
            return card["card_id"], earlier
        print(f"  {card['card_id']}: no checked summary after {ATTEMPTS} attempts, left to the rules")
        return None

    print(f"Summary: {len(groups)} groups in {county['name']}, {PARALLEL} at a time")
    out = dict(r for r in await asyncio.gather(*(one(d, g) for d, g in groups)) if r)
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
