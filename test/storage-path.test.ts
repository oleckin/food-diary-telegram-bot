import { describe, expect, it, vi } from 'vitest';

import { buildStoragePath } from '../src/bot/handlers/storage-path.js';

describe('buildStoragePath', () => {
  it('creates namespaced path for user and date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-18T10:00:00.000Z'));

    const path = buildStoragePath(123456, 'jpg');

    expect(path).toMatch(/^user\/123456\/2026-02-18\/[0-9a-f-]+\.jpg$/);

    vi.useRealTimers();
  });
});
