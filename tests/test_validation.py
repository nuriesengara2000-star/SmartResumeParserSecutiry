"""Тесты валидации входных данных."""

import os
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("HF_TOKEN", "hf_test_token_for_ci")

from app.inference import inference_engine
from app.main import app

MOCK_RESULT = {
    "response": '{"name": "John Doe"}',
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "tokens_used": 42,
}


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_generate_valid(client: AsyncClient) -> None:
    """Успешный запрос с корректными данными → 200."""
    inference_engine._loaded = True
    with patch.object(
    inference_engine, "generate", new_callable=AsyncMock, return_value=MOCK_RESULT
):
        response = await client.post(
            "/generate",
            json={"prompt": "John Doe, Software Engineer", "max_tokens": 256, "temperature": 0.7},
        )
        assert response.status_code == 200
        data = response.json()
        assert "prompt" in data
        assert "response" in data
        assert "model" in data
        assert "tokens_used" in data


@pytest.mark.anyio
async def test_generate_empty_prompt(client: AsyncClient) -> None:
    """Запрос с пустым prompt → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": ""},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_whitespace_only_prompt(client: AsyncClient) -> None:
    """Запрос с промптом из одних пробелов → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": "    "},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_prompt_too_long(client: AsyncClient) -> None:
    """Запрос с prompt > 2000 символов → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": "x" * 2001},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_invalid_temperature_high(client: AsyncClient) -> None:
    """Запрос с temperature > 2.0 → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": "Hello", "temperature": 3.0},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_invalid_temperature_negative(client: AsyncClient) -> None:
    """Запрос с temperature < 0.0 → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": "Hello", "temperature": -0.5},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_invalid_max_tokens(client: AsyncClient) -> None:
    """Запрос с max_tokens > 2048 → 422."""
    response = await client.post(
        "/generate",
        json={"prompt": "Hello", "max_tokens": 9999},
    )
    assert response.status_code == 422
