import type { Address, Contract, Finding } from '@hookguard/types';

export interface AnalyzeRequest {
  address: Address;
  chainId: number;
  contract?: Pick<Contract, 'bytecode' | 'sourceCode' | 'compilerVersion'>;
}

export interface AnalyzeResult {
  address: Address;
  chainId: number;
  findings: Finding[];
  analyzedAt: Date;
}

/**
 * Inspects hook bytecode and (when available) verified source.
 *
 * This is not a generic smart-contract scanner. Implementations must
 * reason about Uniswap v4 hook permissions, lifecycle callbacks, and
 * PoolManager interactions.
 *
 * Phase 0: interface only.
 */
export interface ContractAnalyzer {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResult>;
}
