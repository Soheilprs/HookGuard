import { describe, expect, it } from 'vitest';
import { TelegramNotifier } from './telegram.js';
import { formatAlertText } from './notifier.js';

describe('Telegram notifier', () => {
  const message = {
    hookAddress: '0x0010d0d5db05933fa0d9f7038d365e1541a41888',
    chainId: 1,
    chainName: 'Ethereum',
    eventType: 'IMPLEMENTATION_CHANGED',
    title: 'Implementation changed',
    description: 'EIP-1967 slot changed.',
    severity: 'high',
    confidence: 'HIGH',
  };

  it('skips when token or chat id is missing', async () => {
    const notifier = new TelegramNotifier('', '123');
    expect(notifier.isConfigured()).toBe(false);
    const result = await notifier.send(message);
    expect(result.skipped).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('posts to the Telegram API when configured', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const notifier = new TelegramNotifier('secret-token', '42', (async (url, init) => {
      calls.push({ url: String(url), body: String(init?.body ?? '') });
      return new Response('{"ok":true}', { status: 200 });
    }) as typeof fetch);

    const result = await notifier.send(message);
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain('api.telegram.org/botsecret-token/sendMessage');
    expect(calls[0]?.body).toContain('42');
    expect(calls[0]?.body).toContain('IMPLEMENTATION_CHANGED');
    expect(formatAlertText(message)).toContain('HookGuard security event');
  });

  it('returns a failed result when Telegram is unavailable', async () => {
    const notifier = new TelegramNotifier('secret-token', '42', (async () => {
      return new Response('down', { status: 502 });
    }) as typeof fetch);
    const result = await notifier.send(message);
    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.error).toMatch(/502/);
  });
});
