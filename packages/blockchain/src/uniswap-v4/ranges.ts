export interface BlockRange {
  fromBlock: bigint;
  toBlock: bigint;
}

/**
 * Next inclusive block range to scan, capped at `latest` and `batchSize` long.
 * Returns null when already caught up.
 */
export function nextBlockRange(
  fromBlock: bigint,
  latestBlock: bigint,
  batchSize: bigint,
): BlockRange | null {
  if (batchSize < 1n) {
    throw new Error('batchSize must be >= 1');
  }
  if (fromBlock > latestBlock) {
    return null;
  }
  const toBlock = fromBlock + batchSize - 1n;
  return {
    fromBlock,
    toBlock: toBlock > latestBlock ? latestBlock : toBlock,
  };
}

/**
 * Resume after a checkpoint. No checkpoint → configured start block.
 * Checkpoint always wins so restarts do not re-scan.
 */
export function resumeBlock(
  lastProcessedBlock: bigint | null,
  configuredStartBlock: bigint,
): bigint {
  if (lastProcessedBlock === null) {
    return configuredStartBlock;
  }
  return lastProcessedBlock + 1n;
}

/** Split a range in half when an RPC rejects the window as too large. */
export function splitRange(range: BlockRange): [BlockRange] | [BlockRange, BlockRange] {
  if (range.fromBlock === range.toBlock) {
    return [range];
  }
  const span = range.toBlock - range.fromBlock;
  const mid = range.fromBlock + span / 2n;
  return [
    { fromBlock: range.fromBlock, toBlock: mid },
    { fromBlock: mid + 1n, toBlock: range.toBlock },
  ];
}

export function isRangeTooLargeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('block range') ||
    lower.includes('query returned more than') ||
    lower.includes('log response size') ||
    lower.includes('range is too large') ||
    lower.includes('too many results') ||
    lower.includes('limit exceeded') ||
    lower.includes('method handler crashed') ||
    lower.includes('query timeout') ||
    lower.includes('timed out')
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRpcRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isRangeTooLargeError(error)) {
        throw error;
      }
      const wait = baseDelayMs * 2 ** attempt;
      await delay(wait);
    }
  }

  throw lastError;
}
