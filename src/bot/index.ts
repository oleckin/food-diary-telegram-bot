import { Bot } from 'grammy';

import { env } from '../config/env.js';
import { supabase } from '../services/supabase.js';
import { buildUserUpsertPayload } from './user-upsert.js';

export const bot = new Bot(env.BOT_TOKEN);

async function checkSupabaseConnection(): Promise<boolean> {
  const { error } = await supabase.from('users').select('*').limit(1);
  return !error;
}

bot.command('ping', async (ctx) => {
  const dbHealthy = await checkSupabaseConnection();

  if (!dbHealthy) {
    await ctx.reply('Pong, но не удалось подключиться к Supabase ⚠️');
    return;
  }

  await ctx.reply('Pong ✅ Бот активен, Supabase доступен.');
});

bot.command('start', async (ctx) => {
  const from = ctx.from;

  if (!from) {
    await ctx.reply('Не удалось прочитать профиль Telegram. Попробуйте ещё раз.');
    return;
  }

  const payload = buildUserUpsertPayload(
    {
      telegramId: from.id,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name
    },
    env.USER_TELEGRAM_ID_COLUMN
  );

  const { error } = await supabase.from('users').upsert(payload, {
    onConflict: env.USER_ON_CONFLICT_COLUMN
  });

  if (error) {
    console.error('Failed to upsert user:', error);
    await ctx.reply('Не удалось сохранить профиль в базе. Попробуйте позже 🙏');
    return;
  }

  await ctx.reply(
    'Привет! Я помогу вести дневник питания 💛\nПроверь связь командой /ping и смотри помощь в /help.'
  );
});

bot.command('health', async (ctx) => {
  const dbHealthy = await checkSupabaseConnection();
  const openAiEnabled = Boolean(env.OPENAI_API_KEY);

  await ctx.reply(
    [
      'OK',
      `supabase: ${dbHealthy ? 'connected' : 'error'}`,
      `stt_provider: ${env.STT_PROVIDER}`,
      `openai_api_key_set: ${openAiEnabled}`
    ].join('\n')
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    [
      'Доступные команды:',
      '/start — зарегистрировать/обновить профиль',
      '/ping — проверка бота и базы',
      '/health — служебный статус окружения',
      '/help — показать эту справку'
    ].join('\n')
  );
});
