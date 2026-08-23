export interface AlertMessage {
  hookAddress: string;
  chainId: number;
  chainName: string;
  eventType: string;
  title: string;
  description: string;
  severity: string;
  confidence: string;
}

export interface NotifyResult {
  ok: boolean;
  skipped: boolean;
  error?: string;
}

export interface Notifier {
  readonly channel: string;
  isConfigured(): boolean;
  send(message: AlertMessage): Promise<NotifyResult>;
}

export function formatAlertText(message: AlertMessage): string {
  return [
    'HookGuard security event',
    `${message.eventType} · ${message.severity} · ${message.confidence} confidence`,
    `${message.hookAddress} (${message.chainName})`,
    message.title,
    message.description,
  ].join('\n');
}
