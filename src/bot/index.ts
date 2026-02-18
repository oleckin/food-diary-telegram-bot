import { Bot, type Context } from 'grammy';

import { env } from '../config/env.js';
import { uploadToDefaultBucket } from '../services/storage.js';
import { supabase } from '../services/supabase.js';
import { AlbumCollector, type AlbumBundle } from './handlers/album-collector.js';
import { buildStoragePath } from './handlers/storage-path.js';
import { downloadTelegramFile } from './handlers/telegram-media.js';
import { buildUserUpsertPayload } from './user-upsert.js';

const albumCollector = new AlbumCollector(1200);

export const bot = new Bot(env.BOT_TOKEN);

type EntryInsert = {
  user_id?: string;
  telegram_user_id?: number;
  type: 'text' | 'photo' | 'album';
  text: string | null;
  media_paths: string[];
  created_at: string;
};

async function checkSupabaseConnection(): Promise<boolean> {
  const { error } = await supabase.from('users').select('*').limit(1);
  return !error;
}

async function findUserIdByTelegramId(telegramId: number): Promise<string | null> {
  const columnsToTry = [env.USER_TELEGRAM_ID_COLUMN, 'telegram_user_id', 'telegram_id'];

  for (const column of columnsToTry) {
    const { data, error } = await supabase.from('users').select('id').eq(column, telegramId).maybeSingle();

    if (!error && data?.id) {
      return String(data.id);
    }
  }

  return null;
}

async function insertEntry(payload: EntryInsert): Promise<void> {
  const primaryPayload = {
    user_id: payload.user_id,
    type: payload.type,
    text: payload.text,
    media_paths: payload.media_paths,
    created_at: payload.created_at
  };

  const { error: primaryError } = await supabase.from('entries').insert(primaryPayload);
  if (!primaryError) {
    return;
  }

  const fallbackPayload = {
    telegram_user_id: payload.telegram_user_id,
    text: payload.text,
    media: payload.media_paths,
    context: {
      type: payload.type
    },
    created_at: payload.created_at
  };

  const { error: fallbackError } = await supabase.from('entries').insert(fallbackPayload);
  if (fallbackError) {
    throw new Error(
      `Failed to insert entry. primary=${primaryError.message}; fallback=${fallbackError.message}`
    );
  }
}

async function ensureUser(ctx: Context): Promise<{ userId: string | null; telegramId: number }> {
  const from = ctx.from;
  if (!from) {
    throw new Error('Telegram user is missing in context');
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
    throw new Error(`Failed to upsert user: ${error.message}`);
  }

  const userId = await findUserIdByTelegramId(from.id);
  return { userId, telegramId: from.id };
}

async function saveTextEntry(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (!message || !('text' in message)) {
    return;
  }

  const textValue = message.text ?? '';

  if (textValue.startsWith('/')) {
    return;
  }

  const { userId, telegramId } = await ensureUser(ctx);
  await insertEntry({
    user_id: userId ?? undefined,
    telegram_user_id: telegramId,
    type: 'text',
    text: textValue,
    media_paths: [],
    created_at: new Date().toISOString()
  });

  await ctx.reply('Записано: текст ✅');
}

async function uploadPhoto(fileId: string, telegramId: number): Promise<string> {
  const buffer = await downloadTelegramFile(bot.api, env.BOT_TOKEN, fileId);
  const storagePath = buildStoragePath(telegramId, 'jpg');
  await uploadToDefaultBucket(storagePath, buffer, 'image/jpeg');
  return storagePath;
}

async function saveSinglePhotoEntry(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (!message || !('photo' in message) || !message.photo?.length || message.media_group_id) {
    return;
  }

  const { userId, telegramId } = await ensureUser(ctx);
  const largestPhoto = message.photo[message.photo.length - 1];
  const storagePath = await uploadPhoto(largestPhoto.file_id, telegramId);

  await insertEntry({
    user_id: userId ?? undefined,
    telegram_user_id: telegramId,
    type: 'photo',
    text: message.caption ?? null,
    media_paths: [storagePath],
    created_at: new Date().toISOString()
  });

  await ctx.reply('Записано: фото ✅');
}

async function saveAlbumEntry(bundle: AlbumBundle): Promise<void> {
  const mediaPaths: string[] = [];

  for (const part of bundle.parts) {
    const path = await uploadPhoto(part.fileId, bundle.telegramUserId);
    mediaPaths.push(path);
  }

  const userId = await findUserIdByTelegramId(bundle.telegramUserId);

  await insertEntry({
    user_id: userId ?? undefined,
    telegram_user_id: bundle.telegramUserId,
    type: 'album',
    text: bundle.parts[0]?.caption ?? null,
    media_paths: mediaPaths,
    created_at: new Date().toISOString()
  });

  await bot.api.sendMessage(bundle.chatId, 'Записано: альбом ✅', {
    reply_parameters: {
      message_id: bundle.messageId
    }
  });
}

async function collectAlbum(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (
    !message ||
    !('photo' in message) ||
    !message.photo?.length ||
    !message.media_group_id ||
    !ctx.from ||
    !ctx.chat
  ) {
    return;
  }

  await ensureUser(ctx);

  const largestPhoto = message.photo[message.photo.length - 1];
  albumCollector.collect(
    message.media_group_id,
    {
      mediaGroupId: message.media_group_id,
      telegramUserId: ctx.from.id,
      chatId: ctx.chat.id,
      messageId: message.message_id
    },
    {
      fileId: largestPhoto.file_id,
      caption: message.caption
    },
    async (bundle) => {
      try {
        await saveAlbumEntry(bundle);
      } catch (error) {
        console.error('Failed to save album entry:', error);
        await bot.api.sendMessage(bundle.chatId, 'Не удалось сохранить альбом. Попробуйте позже 🙏');
      }
    }
  );
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
  try {
    await ensureUser(ctx);
    await ctx.reply(
      'Привет! Я помогу вести дневник питания 💛\nПроверь связь командой /ping и смотри помощь в /help.'
    );
  } catch (error) {
    console.error('Failed to handle /start:', error);
    await ctx.reply('Не удалось сохранить профиль в базе. Попробуйте позже 🙏');
  }
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

bot.on('message:text', async (ctx) => {
  try {
    await saveTextEntry(ctx);
  } catch (error) {
    console.error('Failed to save text entry:', error);
    await ctx.reply('Не удалось сохранить текст. Попробуйте позже 🙏');
  }
});

bot.on('message:photo', async (ctx) => {
  try {
    if (ctx.message.media_group_id) {
      await collectAlbum(ctx);
      return;
    }

    await saveSinglePhotoEntry(ctx);
  } catch (error) {
    console.error('Failed to save photo entry:', error);
    await ctx.reply('Не удалось сохранить фото. Попробуйте позже 🙏');
  }
});
