import { describe, expect, it, vi } from 'vitest';

import { AlbumCollector } from '../src/bot/handlers/album-collector.js';

describe('AlbumCollector', () => {
  it('flushes grouped photos as single bundle', async () => {
    vi.useFakeTimers();

    const collector = new AlbumCollector(100);
    const onFlush = vi.fn<(bundle: { parts: { fileId: string }[] }) => Promise<void>>(async () => {});

    collector.collect(
      'grp-1',
      {
        mediaGroupId: 'grp-1',
        telegramUserId: 1,
        chatId: 10,
        messageId: 100
      },
      { fileId: 'file-a' },
      onFlush
    );

    collector.collect(
      'grp-1',
      {
        mediaGroupId: 'grp-1',
        telegramUserId: 1,
        chatId: 10,
        messageId: 101
      },
      { fileId: 'file-b', caption: 'Dinner' },
      onFlush
    );

    await vi.advanceTimersByTimeAsync(120);

    expect(onFlush).toHaveBeenCalledTimes(1);
    const firstArg = onFlush.mock.calls[0]?.[0];
    expect(firstArg?.parts).toHaveLength(2);

    vi.useRealTimers();
  });
});
