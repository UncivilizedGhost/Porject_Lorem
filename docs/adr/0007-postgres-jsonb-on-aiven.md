# PostgreSQL on Aiven, documents as JSONB, supersedes ADR-0001

**Status:** accepted (supersedes ADR-0001)

ADR-0001 chose MongoDB so the data shapes could change hour by hour during the build and so the team could use MongoDB Atlas sponsor credits afterwards. The credits the team actually wants to use at Junction 2026 are Aiven's, and Aiven offers no MongoDB (PostgreSQL, MySQL, Valkey, Kafka, OpenSearch, ClickHouse only). Rather than run two data vendors, the shared backend moves to **Aiven for PostgreSQL**, keeping the document model that made Mongo attractive: every collection in the data contract becomes one table `(id text primary key, created_at timestamptz, doc jsonb)`, and the server reads and writes whole documents through a small helper layer (`server/app/db.py`: insert, upsert, get, find by containment, update by merge, append to a list, truncate). The Pydantic models remain the real schema, exactly as before; the database still does not validate the inside of a document.

The switch happens before any query has been written, so its cost is the helper layer and this record. Later it would have cost a half-day of person 3's time.

The build runs against a local Postgres container (`server/compose.yaml`); only `DATABASE_URL` changes to point at the Aiven service, which comes with `?sslmode=require` in its URI. No Aiven-specific code exists.

**Consequences:**

- Equality filters use JSONB containment (`doc @> '{...}'`); range filters such as "steps due on or before today" are plain SQL on `doc->>'field'` casts. A GIN index on `doc` covers the containment queries at demo scale.
- Ids are uuid4 hex strings, not ObjectIds; they are the same string over HTTP and in the table. `_id` stays the JSON field name so the frontends' contract is unchanged.
- Datetimes are stored as ISO strings inside `doc` (Finnish formatting stays in the UI).
- Tests use a throwaway schema per session rather than a throwaway database.
- `backend/` (medml) remains untouched; this decision concerns `server/` only.
