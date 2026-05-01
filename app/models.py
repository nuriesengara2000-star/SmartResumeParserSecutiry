"""Pydantic-схемы запросов и ответов для GenAI API."""

from pydantic import BaseModel, Field, field_validator


class GenerateRequest(BaseModel):
    """Схема входящего запроса на генерацию."""

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Текст промпта для генерации (1–2000 символов)",
    )
    max_tokens: int = Field(
        default=256,
        ge=1,
        le=2048,
        description="Максимальное количество токенов в ответе (1–2048)",
    )
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Температура генерации (0.0–2.0)",
    )

    @field_validator("prompt")
    @classmethod
    def prompt_not_only_whitespace(cls, v: str) -> str:
        """Проверка, что промпт не состоит только из пробелов."""
        if not v.strip():
            raise ValueError("Промпт не может состоять только из пробелов")
        return v


class GenerateResponse(BaseModel):
    """Схема ответа с результатом генерации."""

    prompt: str = Field(..., description="Текст отправленного промпта")
    response: str = Field(..., description="Сгенерированный текст модели")
    model: str = Field(..., description="Название использованной модели")
    tokens_used: int = Field(..., description="Количество использованных токенов")


class HealthResponse(BaseModel):
    """Схема ответа health-check эндпоинта."""

    status: str = Field(default="ok", description="Статус сервиса")


class ServiceInfoResponse(BaseModel):
    """Схема ответа эндпоинта /info."""

    service: str = Field(..., description="Название сервиса")
    version: str = Field(..., description="Версия API")
    description: str = Field(..., description="Описание сервиса")


class ErrorResponse(BaseModel):
    """Схема ответа при ошибке."""

    detail: str = Field(..., description="Описание ошибки")
