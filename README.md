# food-diary-telegram-bot

MVP Telegram-бота «Осознанный баланс / дневник питания» на `grammy` + Supabase.

## Текущее состояние

PR1: базовый каркас проекта, CI, env validation.

## Stack

- Node.js 20+
- TypeScript
- grammy
- Supabase JS
- Zod (валидация env)

## Быстрый старт

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Установите зависимости:

```bash
npm install
```

3. Запустите в dev-режиме:

```bash
npm run dev
```

## Команды

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## CI

GitHub Actions workflow выполняет install + lint + typecheck + test.

## План следующих PR

- PR2: Supabase migrations + storage wiring
- PR3: `/start` `/help` + upsert user
- PR4: text/photo/album handlers
- PR5: voice + STT
- PR6: `/last` `/week` `/month` + reports
