export type CallTargetSource = 'CONSTANT' | 'STORAGE' | 'UNKNOWN';

export type StackOrigin = 'CONSTANT' | 'STORAGE' | 'CALLDATA' | 'UNKNOWN';

export interface ExternalCallTarget {
  address: string | null;
  source: CallTargetSource;
  origin: StackOrigin;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StackItem {
  value: bigint | null;
  origin: StackOrigin;
}

export function toAddress(value: bigint | null): string | null {
  if (value === null) return null;
  if (value === 0n) return null;
  const mask = (1n << 160n) - 1n;
  const addr = value & mask;
  if (addr === 0n) return null;
  if (value >> 160n !== 0n && value >> 160n !== (value < 0n ? -1n : 0n)) {
    return null;
  }
  return `0x${addr.toString(16).padStart(40, '0')}`;
}

export function sourceFromOrigin(origin: StackOrigin): CallTargetSource {
  if (origin === 'CONSTANT') return 'CONSTANT';
  if (origin === 'STORAGE') return 'STORAGE';
  return 'UNKNOWN';
}
