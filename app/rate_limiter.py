"""Конфигурация Rate Limiting для FastAPI."""
import os
from functools import wraps
from typing import Any, Callable
from slowapi import Limiter
from slowapi.util import get_remote_address
# Лимитер по IP-адресу клиента с in-memory хранилищем
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    strategy="fixed-window",
)
# Проверка тестового окружения
IS_TESTING = os.getenv("TESTING", "").lower() in ("true", "1", "yes")
def rate_limit_decorator(limit_string: str) -> Callable:
    """Условный декоратор для rate limiting.
    В тестовом окружении возвращает пустой декоратор.
    В production возвращает настоящий rate limiter.
    """
    if IS_TESTING:
        # Пустой декоратор для тестов
        def no_op_decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                return await func(*args, **kwargs)
            return wrapper
        return no_op_decorator
    else:
        # Настоящий rate limiter
        return limiter.limit(limit_string)