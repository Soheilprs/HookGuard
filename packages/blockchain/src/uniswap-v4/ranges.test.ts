import { describe, expect, it } from 'vitest';
import {
  isRangeTooLargeError,
  nextBlockRange,
  resumeBlock,
  splitRange,
} from './ranges.js';

describe('checkpoint and batch ranges', () => {
  it('starts at the configured block when no checkpoint exists', () => {
    expect(resumeBlock(null, 21689047n)).toBe(21689047n);
  });

  it('resumes at lastProcessedBlock + 1', () => {
    expect(resumeBlock(100n, 1n)).toBe(101n);
  });

  it('batches without exceeding latest', () => {
    expect(nextBlockRange(100n, 350n, 200n)).toEqual({
      fromBlock: 100n,
      toBlock: 299n,
    });
    expect(nextBlockRange(300n, 350n, 200n)).toEqual({
      fromBlock: 300n,
      toBlock: 350n,
    });
    expect(nextBlockRange(351n, 350n, 200n)).toBeNull();
  });

  it('splits an oversized range in half', () => {
    expect(splitRange({ fromBlock: 10n, toBlock: 20n })).toEqual([
      { fromBlock: 10n, toBlock: 15n },
      { fromBlock: 16n, toBlock: 20n },
    ]);
  });

  it('detects RPC range errors', () => {
    expect(isRangeTooLargeError(new Error('query returned more than 10000 events'))).toBe(
      true,
    );
    expect(isRangeTooLargeError(new Error('timeout'))).toBe(false);
  });
});
