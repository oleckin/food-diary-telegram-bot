import { describe, expect, it } from 'vitest';

import { buildUserUpsertPayload } from '../src/bot/user-upsert.js';

describe('buildUserUpsertPayload', () => {
  it('uses dynamic telegram id column and fills default null fields', () => {
    const payload = buildUserUpsertPayload(
      {
        telegramId: 12345,
        firstName: 'Olesya'
      },
      'telegram_id'
    );

    expect(payload.telegram_id).toBe(12345);
    expect(payload.first_name).toBe('Olesya');
    expect(payload.username).toBeNull();
    expect(payload.last_name).toBeNull();
    expect(typeof payload.updated_at).toBe('string');
  });
});
