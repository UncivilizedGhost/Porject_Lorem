"""Questions catalogue from the rules module. Owner: person 3. No grade maps leave the server."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("")
async def catalogue():
    """rules_version, Safety Check items, symptoms + guided questions (ids, prompts, kinds, options, units), the PRO-CTCAE triple, Check-in items, warning-sign list."""
    raise HTTPException(status_code=501, detail="not implemented")
