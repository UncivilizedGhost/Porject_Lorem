"""Questions catalogue from the rules module. Owner: person 3. No grade maps leave the server."""

from fastapi import APIRouter

from app import rules

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("")
async def catalogue():
    """rules_version, Safety Check items, symptoms + guided questions (ids, prompts, kinds, options, units), the PRO-CTCAE triple, Check-in items, warning-sign list."""
    return rules.catalogue()
