"""GET /rules serves the questions half of the rules module (HTTP seam)."""

from app.rules import RULES_VERSION


async def test_rules_endpoint_serves_the_catalogue(client):
    r = await client.get("/rules")
    assert r.status_code == 200
    body = r.json()
    assert body["rules_version"] == RULES_VERSION
    assert len(body["safety_check_items"]) == 7
    assert body["checkin_items"]
    temp = next(i for i in body["checkin_items"] if i["id"] == "temperature")
    assert temp["kind"] == "number" and temp["unit"] == "°C"
