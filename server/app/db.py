"""asyncpg pool and a small document-store layer over PostgreSQL JSONB (ADR-0007).

One table per "collection" of the data contract: `(id text PRIMARY KEY, created_at timestamptz,
doc jsonb)`. The Pydantic models in `app/models` are the schema; the database stores the
document as-is. Managed Postgres on Aiven for the demo, local Postgres (`server/compose.yaml`)
for the build; only `DATABASE_URL` differs.

Pass documents as plain JSON-able dicts: `model.model_dump(mode="json", by_alias=True)`.
Equality filters go through `find(where=...)` (JSONB containment). Anything else (ranges such
as `due_demo_day <= $1`, joins) is plain SQL through `fetch()` on `doc->>'field'`.
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime
from typing import Any

import asyncpg

from app import config

# Cleared by POST /demo/reset
RUNTIME_TABLES = ["contacts", "patients", "events", "alerts", "escalation_steps", "appointments", "decisions"]
# Seeded on startup
SEEDED_TABLES = ["coordinators", "clock_state"]
# Fixtures: seeded once, never written at runtime
FIXTURE_TABLES = ["counties", "actions", "clinicians"]
TABLES = RUNTIME_TABLES + SEEDED_TABLES + FIXTURE_TABLES

_pool: asyncpg.Pool | None = None


def _json_default(o: Any) -> str:
    if isinstance(o, datetime | date):
        return o.isoformat()
    raise TypeError(f"not JSON serialisable: {type(o).__name__}")


async def _init_connection(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec(
        "jsonb",
        encoder=lambda v: json.dumps(v, default=_json_default, ensure_ascii=False),
        decoder=json.loads,
        schema="pg_catalog",
    )


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            config.DATABASE_URL,
            min_size=1,
            max_size=10,
            timeout=5,
            server_settings={"search_path": config.DB_SCHEMA},
            init=_init_connection,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def init_schema() -> None:
    """Create the schema and every table if missing. Idempotent; runs at startup."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{config.DB_SCHEMA}"')
        for t in TABLES:
            await conn.execute(
                f'CREATE TABLE IF NOT EXISTS "{t}" ('
                "id text PRIMARY KEY, "
                "created_at timestamptz NOT NULL DEFAULT now(), "
                "doc jsonb NOT NULL)"
            )
            await conn.execute(f'CREATE INDEX IF NOT EXISTS "{t}_doc_gin" ON "{t}" USING gin (doc)')


def new_id() -> str:
    return uuid.uuid4().hex


def _row(r: asyncpg.Record) -> dict[str, Any]:
    return {"_id": r["id"], "created_at": r["created_at"].isoformat(), **r["doc"]}


def _strip(doc: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in doc.items() if k not in ("_id", "created_at")}


async def insert(table: str, doc: dict[str, Any], *, id: str | None = None) -> str:
    id = id or doc.get("_id") or new_id()
    pool = await get_pool()
    await pool.execute(f'INSERT INTO "{table}" (id, doc) VALUES ($1, $2)', id, _strip(doc))
    return id


async def upsert(table: str, id: str, doc: dict[str, Any], *, overwrite: bool = True) -> None:
    """Insert or replace by id. `overwrite=False` is "set on insert only" (clock_state seed)."""
    on_conflict = "DO UPDATE SET doc = EXCLUDED.doc" if overwrite else "DO NOTHING"
    pool = await get_pool()
    await pool.execute(
        f'INSERT INTO "{table}" (id, doc) VALUES ($1, $2) ON CONFLICT (id) {on_conflict}', id, _strip(doc)
    )


async def get(table: str, id: str) -> dict[str, Any] | None:
    pool = await get_pool()
    r = await pool.fetchrow(f'SELECT id, created_at, doc FROM "{table}" WHERE id = $1', id)
    return _row(r) if r else None


async def find(
    table: str,
    where: dict[str, Any] | None = None,
    *,
    newest_first: bool = False,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    """Equality filter by JSONB containment, e.g. `{"subject_id": x, "closed_at": None}`."""
    sql = f'SELECT id, created_at, doc FROM "{table}"'
    args: list[Any] = []
    if where:
        sql += " WHERE doc @> $1"
        args.append(where)
    sql += f" ORDER BY created_at {'DESC' if newest_first else 'ASC'}, id"
    if limit:
        sql += f" LIMIT {int(limit)}"
    pool = await get_pool()
    return [_row(r) for r in await pool.fetch(sql, *args)]


async def fetch(sql: str, *args: Any) -> list[dict[str, Any]]:
    """Raw query returning `id, created_at, doc` rows, e.g.
    `SELECT id, created_at, doc FROM escalation_steps
      WHERE (doc->>'due_demo_day')::int <= $1 AND doc->>'fired_at' IS NULL`"""
    pool = await get_pool()
    return [_row(r) for r in await pool.fetch(sql, *args)]


async def update(table: str, id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    """Shallow merge of top-level fields (`doc || patch`)."""
    pool = await get_pool()
    r = await pool.fetchrow(
        f'UPDATE "{table}" SET doc = doc || $2 WHERE id = $1 RETURNING id, created_at, doc', id, _strip(patch)
    )
    return _row(r) if r else None


async def append(table: str, id: str, field: str, value: Any) -> None:
    """Append `value` to the array at top-level `field` (creates it if missing)."""
    pool = await get_pool()
    await pool.execute(
        f'UPDATE "{table}" SET doc = jsonb_set(doc, ARRAY[$2]::text[], '
        f"COALESCE(doc->$2, '[]'::jsonb) || $3) WHERE id = $1",
        id, field, [value],
    )


async def truncate(tables: list[str]) -> None:
    pool = await get_pool()
    await pool.execute("TRUNCATE " + ", ".join(f'"{t}"' for t in tables))
