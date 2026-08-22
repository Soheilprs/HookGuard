import { getAddress, zeroAddress, type Address } from 'viem';
import { getChainById } from '../chains.js';
import type { ReadOnlyClient } from './pool-manager.js';

const erc20SymbolAbi = [
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const;

const erc20Bytes32SymbolAbi = [
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

export interface TokenMetadataProvider {
  getSymbol(chainId: number, address: Address): Promise<string>;
}

function bytes32ToSymbol(value: `0x${string}`): string {
  const hex = value.slice(2);
  const chars: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    const code = Number.parseInt(hex.slice(i, i + 2), 16);
    if (code === 0) break;
    chars.push(String.fromCharCode(code));
  }
  return chars.join('') || value.slice(0, 10);
}

export class ViemTokenMetadataProvider implements TokenMetadataProvider {
  private readonly cache = new Map<string, string>();

  constructor(private readonly clients: Map<number, ReadOnlyClient>) {}

  async getSymbol(chainId: number, address: Address): Promise<string> {
    const normalized = getAddress(address);
    const key = `${chainId}:${normalized.toLowerCase()}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const chain = getChainById(chainId);
    if (normalized === zeroAddress) {
      const symbol = chain?.nativeCurrency.symbol ?? 'ETH';
      this.cache.set(key, symbol);
      return symbol;
    }

    const client = this.clients.get(chainId);
    if (!client) {
      const fallback = truncated(normalized);
      this.cache.set(key, fallback);
      return fallback;
    }

    try {
      const symbol = (await client.readContract({
        address: normalized,
        abi: erc20SymbolAbi,
        functionName: 'symbol',
      })) as string;
      const clean = symbol.trim() || truncated(normalized);
      this.cache.set(key, clean);
      return clean;
    } catch {
      try {
        const raw = (await client.readContract({
          address: normalized,
          abi: erc20Bytes32SymbolAbi,
          functionName: 'symbol',
        })) as `0x${string}`;
        const symbol = bytes32ToSymbol(raw);
        this.cache.set(key, symbol);
        return symbol;
      } catch {
        const fallback = truncated(normalized);
        this.cache.set(key, fallback);
        return fallback;
      }
    }
  }
}

export class StaticTokenMetadataProvider implements TokenMetadataProvider {
  constructor(private readonly symbols: Record<string, string> = {}) {}

  async getSymbol(chainId: number, address: Address): Promise<string> {
    const normalized = getAddress(address);
    if (normalized === zeroAddress) {
      return getChainById(chainId)?.nativeCurrency.symbol ?? 'ETH';
    }
    return (
      this.symbols[normalized.toLowerCase()] ??
      this.symbols[`${chainId}:${normalized.toLowerCase()}`] ??
      truncated(normalized)
    );
  }
}

function truncated(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function currencyPairLabel(symbol0: string, symbol1: string): string {
  return `${symbol0}/${symbol1}`;
}
