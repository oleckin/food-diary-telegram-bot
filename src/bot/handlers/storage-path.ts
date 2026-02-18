import { randomUUID } from 'node:crypto';

export function buildStoragePath(telegramUserId: number, extension = 'jpg'): string {
  const date = new Date().toISOString().slice(0, 10);
  return `user/${telegramUserId}/${date}/${randomUUID()}.${extension}`;
}
