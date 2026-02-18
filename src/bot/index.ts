import { Bot } from 'grammy';

import { env } from '../config/env.js';

export const bot = new Bot(env.BOT_TOKEN);

bot.command('start', async (ctx) => {
  await ctx.reply('Привет! MVP в сборке. Используй /help.');
});

bot.command('help', async (ctx) => {
  await ctx.reply('Команды: /start /help');
});
