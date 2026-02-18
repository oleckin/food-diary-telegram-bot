-- 202602180001_init_food_diary.sql
-- MVP schema for food diary bot
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  message_id bigint,
  chat_id bigint,
  text text,
  media jsonb not null default '[]'::jsonb,
  voice jsonb,
  context jsonb,
  satiety text,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_created_at_idx
  on public.entries (telegram_user_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  period text not null check (period in ('last','week','month')),
  report_md text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_user_created_at_idx
  on public.reports (telegram_user_id, created_at desc);
