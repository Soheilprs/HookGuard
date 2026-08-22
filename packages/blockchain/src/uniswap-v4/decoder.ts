import {
  decodeEventLog,
  getAddress,
  zeroAddress,
  type Hex,
  type Log,
} from 'viem';
import { INITIALIZE_EVENT, INITIALIZE_TOPIC } from './events.js';

export interface DecodedInitialize {
  poolId: Hex;
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
  sqrtPriceX96: bigint;
  tick: number;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: Hex;
  hasHook: boolean;
}

export function isInitializeTopic(topic: Hex | undefined): boolean {
  return topic?.toLowerCase() === INITIALIZE_TOPIC;
}

export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === zeroAddress;
}

export function normalizeAddress(address: string): `0x${string}` {
  return getAddress(address);
}

export function decodeInitializeLog(
  log: Pick<Log, 'topics' | 'data' | 'blockNumber' | 'logIndex' | 'transactionHash'>,
): DecodedInitialize {
  const decoded = decodeEventLog({
    abi: [INITIALIZE_EVENT],
    data: log.data,
    topics: log.topics,
  });

  if (decoded.eventName !== 'Initialize') {
    throw new Error(`Unexpected event: ${decoded.eventName}`);
  }

  const args = decoded.args;
  const hooks = getAddress(args.hooks);
  const currency0 = getAddress(args.currency0);
  const currency1 = getAddress(args.currency1);

  if (log.blockNumber === null || log.logIndex === null || !log.transactionHash) {
    throw new Error('Initialize log is missing block metadata');
  }

  return {
    poolId: args.id,
    currency0,
    currency1,
    fee: args.fee,
    tickSpacing: args.tickSpacing,
    hooks,
    sqrtPriceX96: args.sqrtPriceX96,
    tick: args.tick,
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    transactionHash: log.transactionHash,
    hasHook: !isZeroAddress(hooks),
  };
}

export function decodeInitializeLogs(
  logs: Array<Pick<Log, 'topics' | 'data' | 'blockNumber' | 'logIndex' | 'transactionHash'>>,
): DecodedInitialize[] {
  const decoded: DecodedInitialize[] = [];
  for (const log of logs) {
    if (!isInitializeTopic(log.topics[0])) continue;
    decoded.push(decodeInitializeLog(log));
  }
  return decoded;
}
