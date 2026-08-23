import { formatAlertText, type AlertMessage, type Notifier, type NotifyResult } from './notifier.js';

type FetchLike = typeof fetch;

export class TelegramNotifier implements Notifier {
  readonly channel = 'telegram';

  constructor(
    private readonly token: string,
    private readonly chatId: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  isConfigured(): boolean {
    return this.token.length > 0 && this.chatId.length > 0;
  }

  async send(message: AlertMessage): Promise<NotifyResult> {
    if (!this.isConfigured()) {
      return { ok: false, skipped: true };
    }

    try {
      const response = await this.fetchImpl(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: formatAlertText(message),
            disable_web_page_preview: true,
          }),
        },
      );
      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        return {
          ok: false,
          skipped: false,
          error: `Telegram HTTP ${response.status}: ${detail.slice(0, 300)}`,
        };
      }
      return { ok: true, skipped: false };
    } catch (error) {
      return {
        ok: false,
        skipped: false,
        error: error instanceof Error ? error.message : 'Telegram request failed',
      };
    }
  }
}

export function telegramFromEnv(
  source: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): TelegramNotifier {
  return new TelegramNotifier(
    source.TELEGRAM_BOT_TOKEN ?? '',
    source.TELEGRAM_CHAT_ID ?? '',
    fetchImpl,
  );
}
