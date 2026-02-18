# food-diary-telegram-bot

MVP Telegram-бота «Осознанный баланс / дневник питания» на `grammy` + Supabase.

## Текущее состояние

- PR1: базовый каркас проекта, CI, env validation.
- PR2: Supabase migration + базовый storage wiring.
- PR3: MVP команды `/ping`, `/start`, `/health`, `/help`.

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

## Supabase prerequisites

Перед запуском PR3 убедитесь, что в Supabase уже есть объекты из PR2:

- Таблицы `public.users`, `public.entries`, `public.reports`
- Private bucket с именем из `SUPABASE_STORAGE_BUCKET` (по умолчанию `food`)

> Если нужно создать таблицы с нуля, используйте SQL из `supabase/migrations/202602180001_init_food_diary.sql` через Supabase SQL Editor.

## MVP PR3

### Как запустить локально

1. Установите зависимости:

```bash
npm install
```

2. Заполните `.env` (минимум: `BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Запустите бота:

```bash
npm run dev
```

### Какие env нужны

Обязательные:

- `BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Опциональные/с дефолтами:

- `SUPABASE_STORAGE_BUCKET=food`
- `USER_TELEGRAM_ID_COLUMN=telegram_id`
- `USER_ON_CONFLICT_COLUMN=telegram_id`
- `STT_PROVIDER=none`
- `OPENAI_API_KEY=`

### Как проверить в Telegram

- Отправьте `/ping` → бот должен ответить, что жив и Supabase доступен.
- Отправьте `/start` → бот должен сделать upsert пользователя в таблицу `users`.
- Отправьте `/health` → бот должен показать статус Supabase и флаги env.
- Отправьте `/help` → список доступных команд.

## GitHub Actions secrets

1. Откройте GitHub: **Settings → Secrets and variables → Actions**
2. Нажмите **New repository secret**
3. Добавьте секреты:
   - `BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (опционально) `OPENAI_API_KEY`

## Security notes

- Никогда не коммитьте `BOT_TOKEN` и `SUPABASE_SERVICE_ROLE_KEY`.
- Секреты должны храниться только в `.env` (локально) и в GitHub Secrets (в CI/деплое).
- Service role key используется только на серверной стороне.

## Команды проекта

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## CI

GitHub Actions workflow выполняет install + lint + typecheck + test.
