"""Фильтры безопасности для защиты от prompt injection."""

import re

from fastapi import HTTPException

# Паттерны prompt injection
# Каждый паттерн — кортеж (regex, причина блокировки)
INJECTION_PATTERNS: list[tuple[str, str]] = [
    # Попытки переопределить системную инструкцию
    (
        r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)",
        "Попытка отменить системные инструкции",
    ),
    (
        r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)",
        "Попытка отменить системные инструкции",
    ),
    (
        r"forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?)",
        "Попытка сбросить контекст модели",
    ),
    # Попытки переключить роль модели
    (
        r"you\s+are\s+now\s+",
        "Попытка переназначить роль модели",
    ),
    (
        r"act\s+as\s+(if\s+you\s+are|a)\s+",
        "Попытка переназначить роль модели",
    ),
    (
        r"pretend\s+(you\s+are|to\s+be)\s+",
        "Попытка переназначить роль модели",
    ),
    # Прямые системные инструкции
    (
        r"^\s*system\s*:",
        "Попытка внедрить системную инструкцию",
    ),
    (
        r"\[system\]",
        "Попытка внедрить системную инструкцию",
    ),
    (
        r"<\|?system\|?>",
        "Попытка внедрить системный тег",
    ),
    # Попытки извлечь системный промпт
    (
        r"(show|reveal|print|output|repeat)\s+(me\s+)?(your|the)\s+(system|initial|original)\s+(prompt|instructions?|message)",
        "Попытка извлечь системный промпт",
    ),
    # Попытки обойти ограничения
    (
        r"(do\s+not|don'?t)\s+(follow|obey|respect)\s+(any\s+)?(rules?|guidelines?|restrictions?)",
        "Попытка обойти ограничения модели",
    ),
    (
        r"jailbreak",
        "Обнаружено ключевое слово jailbreak",
    ),
]

# Компилируем паттерны для производительности
_COMPILED_PATTERNS = [
    (re.compile(pattern, re.IGNORECASE), reason)
    for pattern, reason in INJECTION_PATTERNS
]


def check_prompt_injection(prompt: str) -> None:
    """Проверяет промпт на наличие паттернов prompt injection.

    Raises:
        HTTPException: 400 Bad Request при обнаружении подозрительного контента.
    """
    for pattern, reason in _COMPILED_PATTERNS:
        if pattern.search(prompt):
            raise HTTPException(
                status_code=400,
                detail=f"Запрос отклонён: {reason}",
            )
