"""Hello world against the Postgres the API talks to.

Uses `app.config.DATABASE_URL` (repo-root `.env` or the environment), so it works
against both `server/compose.yaml` and the Aiven service. It creates one table,
upserts one row, reads it back, and prints it; safe to run repeatedly.

    cd server && python hello_pg.py
"""

from __future__ import annotations

import asyncio
import sys

from app import db


async def main() -> None:
    try:
        pool = await db.get_pool()
    except Exception as exc:  # noqa: BLE001 - this is a smoke test, print and exit
        print(f"could not connect to Postgres: {exc}", file=sys.stderr)
        print(
            "start the local database with `docker compose up -d`, "
            "or set DATABASE_URL (see .env.example)",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS hello_world (
                    id integer PRIMARY KEY,
                    message text NOT NULL,
                    written_at timestamptz NOT NULL DEFAULT now()
                )
                """
            )
            await conn.execute(
                "INSERT INTO hello_world (id, message) VALUES (1, $1) "
                "ON CONFLICT (id) DO UPDATE "
                "SET message = EXCLUDED.message, written_at = now()",
                "Hello, Postgres!",
            )
            row = await conn.fetchrow(
                "SELECT message, written_at, current_database() AS database, "
                "current_setting('server_version') AS version "
                "FROM hello_world WHERE id = 1"
            )
    finally:
        await db.close_pool()

    print(
        f"{row['message']} database={row['database']} "
        f"server={row['version']} written_at={row['written_at'].isoformat()}"
    )


if __name__ == "__main__":
    asyncio.run(main())
