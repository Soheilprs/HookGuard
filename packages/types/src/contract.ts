import type { Address } from './hook.js';

export interface Contract {
  address: Address;
  chainId: number;
  bytecode: string;
  sourceCode: string | null;
  compilerVersion: string | null;
}
