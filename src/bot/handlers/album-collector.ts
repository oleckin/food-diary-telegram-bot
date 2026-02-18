export type AlbumPart = {
  fileId: string;
  caption?: string;
};

export type AlbumBundle = {
  mediaGroupId: string;
  telegramUserId: number;
  chatId: number;
  messageId: number;
  parts: AlbumPart[];
};

type AlbumState = AlbumBundle & {
  timeout: NodeJS.Timeout;
};

export class AlbumCollector {
  private readonly delayMs: number;

  private readonly albums = new Map<string, AlbumState>();

  public constructor(delayMs: number) {
    this.delayMs = delayMs;
  }

  public collect(
    key: string,
    seed: Omit<AlbumBundle, 'parts'>,
    part: AlbumPart,
    onFlush: (bundle: AlbumBundle) => Promise<void>
  ): void {
    const existing = this.albums.get(key);

    if (existing) {
      existing.parts.push(part);
      if (part.caption && !existing.parts[0]?.caption) {
        existing.parts[0].caption = part.caption;
      }
      clearTimeout(existing.timeout);
      existing.timeout = this.createTimeout(key, onFlush);
      return;
    }

    const state: AlbumState = {
      ...seed,
      parts: [part],
      timeout: this.createTimeout(key, onFlush)
    };

    this.albums.set(key, state);
  }

  private createTimeout(key: string, onFlush: (bundle: AlbumBundle) => Promise<void>): NodeJS.Timeout {
    return setTimeout(() => {
      void this.flush(key, onFlush);
    }, this.delayMs);
  }

  private async flush(key: string, onFlush: (bundle: AlbumBundle) => Promise<void>): Promise<void> {
    const state = this.albums.get(key);

    if (!state) {
      return;
    }

    this.albums.delete(key);
    clearTimeout(state.timeout);

    await onFlush({
      mediaGroupId: state.mediaGroupId,
      telegramUserId: state.telegramUserId,
      chatId: state.chatId,
      messageId: state.messageId,
      parts: state.parts
    });
  }
}
