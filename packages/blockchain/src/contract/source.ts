import { getAddress, type Address } from 'viem';

export interface VerifiedSource {
  sourceVerified: boolean;
  sourceUrl: string | null;
  compilerVersion: string | null;
  abi: unknown[] | null;
  sourceCode: string | null;
}

export interface SourceProvider {
  getVerifiedSource(chainId: number, address: Address): Promise<VerifiedSource>;
}

export const EMPTY_SOURCE: VerifiedSource = {
  sourceVerified: false,
  sourceUrl: null,
  compilerVersion: null,
  abi: null,
  sourceCode: null,
};

type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

const DEFAULT_TIMEOUT_MS = 8_000;

export class StaticSourceProvider implements SourceProvider {
  constructor(private readonly records: Map<string, VerifiedSource> = new Map()) {}

  async getVerifiedSource(chainId: number, address: Address): Promise<VerifiedSource> {
    return this.records.get(keyOf(chainId, address)) ?? EMPTY_SOURCE;
  }
}

export class SourcifySourceProvider implements SourceProvider {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async getVerifiedSource(chainId: number, address: Address): Promise<VerifiedSource> {
    const checksum = getAddress(address);
    const urls = [
      `https://repo.sourcify.dev/contracts/full_match/${chainId}/${checksum}/metadata.json`,
      `https://repo.sourcify.dev/contracts/partial_match/${chainId}/${checksum}/metadata.json`,
    ];

    for (const url of urls) {
      try {
        const response = await this.fetchImpl(url, {
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        });
        if (!response.ok) continue;
        const metadata = (await response.json()) as {
          compiler?: { version?: string };
          output?: { abi?: unknown[] };
        };
        return {
          sourceVerified: true,
          sourceUrl: url,
          compilerVersion: metadata.compiler?.version ?? null,
          abi: Array.isArray(metadata.output?.abi) ? metadata.output.abi : null,
          sourceCode: null,
        };
      } catch {
        // Source is optional. Bytecode inspection continues without it.
      }
    }

    return EMPTY_SOURCE;
  }
}

export class EtherscanSourceProvider implements SourceProvider {
  constructor(
    private readonly apiUrlForChain: (chainId: number) => string | undefined,
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async getVerifiedSource(chainId: number, address: Address): Promise<VerifiedSource> {
    const base = this.apiUrlForChain(chainId);
    if (!base) return EMPTY_SOURCE;

    const checksum = getAddress(address);
    const url = new URL(base);
    url.searchParams.set('module', 'contract');
    url.searchParams.set('action', 'getsourcecode');
    url.searchParams.set('address', checksum);
    if (chainId === 1 && url.hostname.includes('etherscan.io')) {
      url.searchParams.set('chainid', String(chainId));
    }
    if (this.apiKey) url.searchParams.set('apikey', this.apiKey);

    try {
      const response = await this.fetchImpl(url.toString(), {
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      if (!response.ok) return EMPTY_SOURCE;
      const body = (await response.json()) as {
        status?: string;
        result?: Array<{
          SourceCode?: string;
          ABI?: string;
          CompilerVersion?: string;
        }>;
      };
      const row = body.result?.[0];
      if (!row || !row.SourceCode || row.SourceCode === '') {
        return EMPTY_SOURCE;
      }
      let abi: unknown[] | null = null;
      if (row.ABI && row.ABI !== 'Contract source code not verified') {
        try {
          const parsed = JSON.parse(row.ABI) as unknown;
          if (Array.isArray(parsed)) abi = parsed;
        } catch {
          abi = null;
        }
      }
      return {
        sourceVerified: true,
        sourceUrl: url.origin,
        compilerVersion: row.CompilerVersion || null,
        abi,
        sourceCode: row.SourceCode,
      };
    } catch {
      return EMPTY_SOURCE;
    }
  }
}

export class CompositeSourceProvider implements SourceProvider {
  constructor(private readonly providers: SourceProvider[]) {}

  async getVerifiedSource(chainId: number, address: Address): Promise<VerifiedSource> {
    for (const provider of this.providers) {
      const result = await provider.getVerifiedSource(chainId, address);
      if (result.sourceVerified) return result;
    }
    return EMPTY_SOURCE;
  }
}

export function explorerApiUrl(chainId: number): string | undefined {
  if (chainId === 1) return 'https://api.etherscan.io/v2/api';
  if (chainId === 130) return 'https://api.uniscan.xyz/api';
  return undefined;
}

export function createDefaultSourceProvider(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: FetchLike = fetch,
): SourceProvider {
  const etherscanKey = env.ETHERSCAN_API_KEY ?? env.UNISCAN_API_KEY ?? '';
  return new CompositeSourceProvider([
    new SourcifySourceProvider(fetchImpl),
    new EtherscanSourceProvider(explorerApiUrl, etherscanKey, fetchImpl),
  ]);
}

function keyOf(chainId: number, address: Address): string {
  return `${chainId}:${address.toLowerCase()}`;
}
