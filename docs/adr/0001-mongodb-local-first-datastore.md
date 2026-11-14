# MongoDB as the shared datastore, local-first for the hackathon build

**Status:** accepted

The shared backend needs one datastore reachable by all three frontend surfaces (companion, worklist, dashboard), flexible enough for the Contact/Patient/Pathway/Event/Alert/EscalationStep shapes to change hour by hour during the build. We chose MongoDB over the zero-setup alternative (SQLite) because the team wants to integrate with MongoDB Atlas using Junction 2026 sponsor credits beyond the hackathon. Atlas isn't provisioned yet, so the build starts against a local `mongod` instance; only the connection string (an env var) changes once Atlas credits land, since the same PyMongo/Motor code targets either.

**Consequences:** schema is enforced in the FastAPI/Pydantic layer, not the database — Mongo won't reject a malformed document, so the four builders must treat the data contract in `.scratch/pathway-companion/spec.md` as authoritative.
