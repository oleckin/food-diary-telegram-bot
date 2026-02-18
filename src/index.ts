import { bot } from './bot/index.js';

async function main(): Promise<void> {
  await bot.start();
  console.log('Bot started');
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
