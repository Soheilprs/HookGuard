export type Address = `0x${string}`;

export interface Hook {
  id: string;
  address: Address;
  chainId: number;
  creator: Address;
  deploymentBlock: bigint;
  verifiedSource: boolean;
  /** Null until the risk engine has scored the hook. Range 0–100 when present. */
  riskScore: number | null;
  createdAt: Date;
}

export interface HookSummary {
  id: string;
  address: Address;
  chainId: number;
  creator: Address;
  verifiedSource: boolean;
  riskScore: number | null;
}
