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

## Production deployment (no local secrets)

Выбран хостинг: **Render** (самый простой путь: один Web Service + deploy hook из GitHub Actions).

### 1) Один раз создать Telegram-бота

1. В Telegram откройте `@BotFather`.
2. Выполните `/newbot` и получите `BOT_TOKEN`.
3. Токен **не храните в коде** — добавьте его только в GitHub Secrets.

### 2) GitHub Secrets (единственное место для прод-секретов)

Откройте: **Settings → Secrets and variables → Actions → New repository secret**.

Обязательные secrets:

- `BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RENDER_DEPLOY_HOOK_URL`

Опционально:

- `OPENAI_API_KEY`
- `USER_TELEGRAM_ID_COLUMN` (если в `users` не стандартное имя)
- `USER_ON_CONFLICT_COLUMN` (если `onConflict` отличается)

### 3) Создать сервис в Render

1. Зайдите в Render → **New +** → **Web Service**.
2. Подключите GitHub-репозиторий `food-diary-telegram-bot`.
3. Runtime: Node.
4. Build command: `npm ci && npm run build`.
5. Start command: `npm run start`.
6. Отключите Auto-Deploy (деплой запускает GitHub Actions по hook).
7. В Render откройте **Settings → Deploy Hook** и скопируйте URL.
8. Добавьте URL в GitHub secret `RENDER_DEPLOY_HOOK_URL`.

### 4) Автодеплой из GitHub Actions

- После push/merge в `main` запускается `.github/workflows/deploy.yml`.
- Workflow делает: checkout → Node 20 → `npm ci` → `npm run build` → POST в Render Deploy Hook.
- Секреты читаются только из `${{ secrets.* }}` и не печатаются в логах.

### 5) Проверка после деплоя

1. Откройте чат с ботом в Telegram.
2. Выполните `/ping` — ожидается `Pong ✅ ...`.
3. Выполните `/health` — ожидается `OK`, `version: <sha>`, и статус Supabase.

> Локальный `.env` для production не нужен. `.env.example` остаётся только как справка для разработки.
