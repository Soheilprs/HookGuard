import type { Address, FindingCategory, FindingSeverity } from '@hookguard/types';

export interface AnalysisFunction {
  name: string;
  selector: string;
  visibility: string;
  stateMutability: string;
}

export interface AnalysisPermission {
  type: string;
  address: string;
  source: string;
}

export interface AnalysisProxy {
  isProxy: boolean;
  kind: string;
  implementationAddress: string | null;
  adminAddress: string | null;
}

/**
 * Input to the rule engine. All fields are observed facts from
 * indexing / contract intelligence — never inferred scores.
 */
export interface AnalysisInput {
  hookAddress: Address;
  chainId: number;
  bytecode: `0x${string}`;
  functions: AnalysisFunction[];
  permissions: AnalysisPermission[];
  proxy: AnalysisProxy;
  /**
   * Whether related addresses have empty bytecode.
   * Missing keys mean the code was not fetched; EOA rules must not fire.
   */
  codeEmpty: Record<string, boolean>;
}

export interface EngineFinding {
  ruleId: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  description: string;
  evidence: Record<string, unknown>;
}

export interface AnalysisRule {
  id: string;
  run(input: AnalysisInput): EngineFinding[];
}

export function codeIsEmpty(
  input: AnalysisInput,
  address: string | null | undefined,
): boolean | undefined {
  if (!address) return undefined;
  const key = address.toLowerCase();
  if (!(key in input.codeEmpty)) return undefined;
  return input.codeEmpty[key];
}
