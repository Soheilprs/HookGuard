import type { Address } from './hook.js';

export interface Contract {
  id: string;
  address: Address;
  chainId: number;
  bytecode: string;
  sourceCode: string | null;
  compilerVersion: string | null;
  bytecodeHash: string;
  sourceVerified: boolean;
  sourceUrl: string | null;
  abiJson: string | null;
  isProxy: boolean;
  implementationAddress: Address | null;
  adminAddress: Address | null;
  lastCheckedAt: Date | null;
}

export interface ContractFunction {
  id: string;
  contractId: string;
  name: string;
  selector: string;
  visibility: string;
  stateMutability: string;
}

export interface ContractPermission {
  id: string;
  contractId: string;
  type: string;
  address: Address;
  source: string;
}
