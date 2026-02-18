# food-diary-telegram-bot

MVP Telegram-бота «Осознанный баланс / дневник питания» на `grammy` + Supabase.

## Текущее состояние

- PR1: базовый каркас проекта, CI, env validation.
- PR2: Supabase migration + базовый storage wiring.

## Stack

- Node.js 20+
- TypeScript
- grammy
- Supabase JS
- Zod (валидация env)

## Environment variables

Скопируйте шаблон и заполните значения:

```bash
cp .env.example .env
```

## Supabase setup

1. Откройте **Supabase → SQL Editor**.
2. Откройте файл `supabase/migrations/202602180001_init_food_diary.sql` в репозитории, скопируйте его содержимое.
3. Вставьте SQL в SQL Editor и нажмите **Run**.
4. Проверьте, что созданы таблицы в `public`:
   - `users`
   - `entries`
   - `reports`
5. Создайте Storage bucket:
   - Name: значение `SUPABASE_STORAGE_BUCKET` (по умолчанию `food`)
   - Access: **Private**

## Security notes

- Никогда не коммитьте `BOT_TOKEN` и `SUPABASE_SERVICE_ROLE_KEY`.
- Секреты должны храниться только в `.env` (локально) и в GitHub Secrets (в CI/деплое).
- Service role key используется только на серверной стороне.

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Запустите в dev-режиме:

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

- PR3: `/start` `/help` + upsert user
- PR4: text/photo/album handlers
- PR5: voice + STT
- PR6: `/last` `/week` `/month` + reports
