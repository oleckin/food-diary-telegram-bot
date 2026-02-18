export type TelegramUserData = {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export function buildUserUpsertPayload(
  user: TelegramUserData,
  telegramIdColumn: string
): Record<string, unknown> {
  return {
    [telegramIdColumn]: user.telegramId,
    username: user.username ?? null,
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
    updated_at: new Date().toISOString()
  };
}
