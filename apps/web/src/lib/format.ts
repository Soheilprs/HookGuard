import { formatSwapFee } from '@hookguard/blockchain';

export function formatIndexedAt(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export function formatBlock(value: string | number | bigint): string {
  return Number(value).toLocaleString();
}

export function formatFeeLabel(fee: number): string {
  return formatSwapFee(fee);
}
