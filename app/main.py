"""Точка входа FastAPI-приложения GenAI API."""

import json
import logging
import signal
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.inference import inference_engine
from app.models import (
    ErrorResponse,
    GenerateRequest,
    GenerateResponse,
    HealthResponse,
    ServiceInfoResponse,
)
from app.rate_limiter import limiter, rate_limit_decorator
from app.security import check_prompt_injection

STATIC_DIR = Path(__file__).parent / "static"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

SERVICE_VERSION = "2.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Загрузка модели при старте и очистка при завершении."""
    logger.info("Запуск приложения — инициализация модели…")
    try:
        inference_engine.load()
        logger.info("Сервис готов к работе.")
    except Exception as exc:
        logger.error("Не удалось инициализировать модель: %s", exc)
        raise
    yield
    logger.info("Завершение приложения — очистка ресурсов…")
    await inference_engine.close()
    logger.info("Ресурсы освобождены.")


app = FastAPI(
    title="GenAI API",
    description=(
        "Production API для генерации текста с помощью LLM. "
        "Включает rate limiting, валидацию и защиту от prompt injection."
    ),
    version=SERVICE_VERSION,
    lifespan=lifespan,
)

# --- Rate Limiting (должен быть первым) ---
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Graceful shutdown ---
def handle_sigterm(*_args) -> None:
    logger.info("Получен SIGTERM, завершаю работу…")
    raise SystemExit(0)


signal.signal(signal.SIGTERM, handle_sigterm)


# --- Эндпоинты ---

@app.get("/", include_in_schema=False)
async def root():
    """Редирект на чат-интерфейс."""
    return RedirectResponse(url="/chat")


@app.get("/info", response_model=ServiceInfoResponse, summary="Информация о сервисе")
async def info() -> ServiceInfoResponse:
    """Возвращает название, версию и описание сервиса."""
    return ServiceInfoResponse(
        service="GenAI API",
        version=SERVICE_VERSION,
        description="Fine-tuned LLM inference API with rate limiting and security",
    )


@app.get("/health", response_model=HealthResponse, summary="Проверка работоспособности")
async def health() -> HealthResponse:
    """Health check для Docker и облачной платформы."""
    return HealthResponse(status="ok")


@app.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Генерация текста по промпту",
    responses={
        400: {"model": ErrorResponse, "description": "Подозрительный промпт (prompt injection)"},
        422: {"description": "Невалидные входные данные"},
        429: {"model": ErrorResponse, "description": "Превышен лимит запросов"},
        500: {"model": ErrorResponse, "description": "Внутренняя ошибка сервера"},
    },
)
@rate_limit_decorator("10/minute")
async def generate(request: Request, body: GenerateRequest) -> GenerateResponse:
    """Принимает промпт и возвращает сгенерированный текст."""
    check_prompt_injection(body.prompt)

    if not inference_engine.is_loaded:
        raise HTTPException(status_code=500, detail="Модель не загружена")

    try:
        result = await inference_engine.generate(
            prompt=body.prompt,
            max_tokens=body.max_tokens,
        )
    except Exception as exc:
        logger.exception("Ошибка при генерации: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка модели: {exc}",
        )

    return GenerateResponse(
        prompt=body.prompt,
        response=result["response"],
        model=result["model"],
        tokens_used=result["tokens_used"],
    )


@app.post(
    "/generate/stream",
    summary="Стриминговая генерация текста (SSE)",
    responses={
        400: {"model": ErrorResponse, "description": "Подозрительный промпт"},
        422: {"description": "Невалидные входные данные"},
        429: {"model": ErrorResponse, "description": "Превышен лимит запросов"},
        500: {"model": ErrorResponse, "description": "Внутренняя ошибка сервера"},
    },
)
@rate_limit_decorator("10/minute")
async def generate_stream(request: Request, body: GenerateRequest):
    """Стриминговая генерация — отдаёт токены по мере генерации (Server-Sent Events)."""
    check_prompt_injection(body.prompt)

    if not inference_engine.is_loaded:
        raise HTTPException(status_code=500, detail="Модель не загружена")

    async def event_generator():
        try:
            async for token in inference_engine.generate_stream(
                prompt=body.prompt,
                max_tokens=body.max_tokens,
            ):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as exc:
            logger.exception("Ошибка стриминга: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/chat", response_class=HTMLResponse, summary="Веб-интерфейс чата")
async def chat_ui() -> HTMLResponse:
    """Отдаёт встроенный чат-интерфейс."""
    html_path = STATIC_DIR / "index.html"
    return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
