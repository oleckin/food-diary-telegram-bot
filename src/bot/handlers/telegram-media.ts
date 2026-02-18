import type { Api } from 'grammy';

export async function downloadTelegramFile(
  api: Api,
  botToken: string,
  fileId: string
): Promise<Buffer> {
  const file = await api.getFile(fileId);

  if (!file.file_path) {
    throw new Error('Telegram file_path is missing');
  }

  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Telegram file download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
