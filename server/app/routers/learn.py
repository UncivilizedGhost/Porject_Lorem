"""Learn knowledge base (plan section 4.6). Owner: person 4. Pipeline in `app/services/learn/`."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services import learn

router = APIRouter(prefix="/learn", tags=["learn"])


class AskBody(BaseModel):
    question: str
    language: str = "en"


@router.post("/ask")
async def ask(body: AskBody):
    """Body { question, language }. red-flag → safety; no corpus hit → no_source; else Nemotron rephrases retrieved passages → answer with sources. Model failure → best passage verbatim."""
    return await learn.ask(body.question, body.language)
