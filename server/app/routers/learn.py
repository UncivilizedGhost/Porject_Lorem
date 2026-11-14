"""Learn knowledge base (plan section 4.6). Owner: person 4. Pipeline in `app/services/learn/`."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/learn", tags=["learn"])


@router.post("/ask")
async def ask():
    """Body { question, language }. red-flag → safety; no corpus hit → no_source; else Nemotron rephrases retrieved passages → answer with sources. Model failure → best passage verbatim."""
    raise HTTPException(status_code=501, detail="not implemented")
