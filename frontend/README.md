# SmartResume AI — Frontend

Чат-интерфейс для AI-парсера резюме. Подключён к FastAPI бэкенду с поддержкой стриминга.

## Стек

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- Стриминг через `fetch` + `ReadableStream`

## Как запустить локально

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env.local
echo "NEXT_PUBLIC_API_URL=https://smartresumeparsersecutiry-production.up.railway.app" > .env.local

# 3. Запустить
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Переменные окружения

| Переменная | Описание |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL бэкенда на Railway |

## Деплой на Vercel

1. Залейте код на GitHub
2. Подключите репозиторий на [vercel.com](https://vercel.com)
3. Добавьте `NEXT_PUBLIC_API_URL` в Environment Variables
4. Deploy!

## Архитектура

- `src/hooks/useChat.ts` — вся логика чата и стриминга
- `src/lib/api.ts` — клиент для бэкенда (SSE стриминг)
- `src/components/` — UI компоненты
- Стриминг: `fetch POST /generate/stream` → `response.body.getReader()` → токены дописываются в state
