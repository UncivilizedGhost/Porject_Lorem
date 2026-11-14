"""Person 4. The shared Nemotron client talks to an OpenAI-compatible chat endpoint; the
transport is stubbed, so nothing here touches the network or a real key."""

import httpx
import pytest

from app import config
from app.services import nemotron


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setattr(config, "NEMOTRON_BASE_URL", "https://nemotron.test/v1")
    monkeypatch.setattr(config, "NEMOTRON_MODEL", "nemotron-test")
    monkeypatch.setattr(config, "nemotron_key", lambda: "test-key-not-real")


async def test_complete_posts_a_chat_completion_and_returns_the_text(configured, monkeypatch):
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["json"] = __import__("json").loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": " Plain answer. "}}]})

    monkeypatch.setattr(nemotron, "_transport", httpx.MockTransport(handler))
    text = await nemotron.complete("be plain", "what is a CT?")
    assert text == "Plain answer."
    assert seen["url"] == "https://nemotron.test/v1/chat/completions"
    assert seen["auth"] == "Bearer test-key-not-real"
    assert seen["json"]["model"] == "nemotron-test"
    assert [m["role"] for m in seen["json"]["messages"]] == ["system", "user"]


async def test_complete_raises_when_not_configured(monkeypatch):
    monkeypatch.setattr(config, "NEMOTRON_BASE_URL", "")
    with pytest.raises(RuntimeError):
        await nemotron.complete("s", "u")


async def test_complete_raises_on_http_error(configured, monkeypatch):
    monkeypatch.setattr(
        nemotron, "_transport", httpx.MockTransport(lambda r: httpx.Response(500, json={}))
    )
    with pytest.raises(httpx.HTTPStatusError):
        await nemotron.complete("s", "u")
