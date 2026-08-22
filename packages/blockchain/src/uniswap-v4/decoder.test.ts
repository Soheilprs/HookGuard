import {
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
  keccak256,
  toBytes,
  zeroAddress,
} from 'viem';
import { describe, expect, it } from 'vitest';
import { decodeInitializeLog, isZeroAddress } from './decoder.js';
import { INITIALIZE_EVENT, INITIALIZE_TOPIC } from './events.js';
import { computePoolId } from './pool-id.js';

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const;
const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const TX = ('0x' + 'ab'.repeat(32)) as `0x${string}`;

function encodeInitialize(args: {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
  blockNumber?: bigint;
}) {
  const id = computePoolId(args);
  const topics = encodeEventTopics({
    abi: [INITIALIZE_EVENT],
    eventName: 'Initialize',
    args: {
      id,
      currency0: args.currency0,
      currency1: args.currency1,
    },
  });
  const data = encodeAbiParameters(
    [
      { type: 'uint24' },
      { type: 'int24' },
      { type: 'address' },
      { type: 'uint160' },
      { type: 'int24' },
    ],
    [
      args.fee,
      args.tickSpacing,
      args.hooks,
      79228162514264337593543950336n,
      -123,
    ],
  );

  return {
    topics,
    data,
    blockNumber: args.blockNumber ?? 21_748_025n,
    logIndex: 7,
    transactionHash: TX,
    computedId: id,
  };
}

describe('Initialize event decoding', () => {
  it('uses the canonical Initialize topic', () => {
    expect(
      keccak256(
        toBytes('Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)'),
      ),
    ).toBe(INITIALIZE_TOPIC);
    const encoded = encodeInitialize({
      currency0: USDC,
      currency1: WETH,
      fee: 3000,
      tickSpacing: 60,
      hooks: HOOK,
    });
    expect(encoded.topics[0]?.toLowerCase()).toBe(INITIALIZE_TOPIC);
  });

  it('decodes hook, tokens, fee, tick spacing, and pool id', () => {
    const log = encodeInitialize({
      currency0: USDC,
      currency1: WETH,
      fee: 3000,
      tickSpacing: 60,
      hooks: HOOK,
    });

    const decoded = decodeInitializeLog(log);

    expect(decoded.hooks).toBe(HOOK);
    expect(decoded.currency0).toBe(USDC);
    expect(decoded.currency1).toBe(WETH);
    expect(decoded.fee).toBe(3000);
    expect(decoded.tickSpacing).toBe(60);
    expect(decoded.poolId).toBe(log.computedId);
    expect(decoded.hasHook).toBe(true);
    expect(decoded.blockNumber).toBe(21_748_025n);
  });

  it('marks address(0) hooks as having no hook', () => {
    const log = encodeInitialize({
      currency0: zeroAddress,
      currency1: USDC,
      fee: 100,
      tickSpacing: 1,
      hooks: zeroAddress,
    });
    const decoded = decodeInitializeLog(log);
    expect(decoded.hasHook).toBe(false);
    expect(isZeroAddress(decoded.hooks)).toBe(true);
  });

  it('decodes the dynamic-fee sentinel', () => {
    const log = encodeInitialize({
      currency0: USDC,
      currency1: WETH,
      fee: 8_388_608,
      tickSpacing: 60,
      hooks: HOOK,
    });
    expect(decodeInitializeLog(log).fee).toBe(8_388_608);
  });
});
