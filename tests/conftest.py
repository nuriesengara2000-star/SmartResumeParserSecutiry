"""Общие фикстуры для всех тестов."""

import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("HF_TOKEN", "hf_test_token_for_ci")

from app.main import app, limiter  # noqa: E402


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Сбрасывает счётчики rate limiter перед каждым тестом."""
    limiter._storage.reset()
    yield
    limiter._storage.reset()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
