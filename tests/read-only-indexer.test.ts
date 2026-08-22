import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const forbidden = [
  /PRIVATE_KEY/,
  /mnemonic/i,
  /sendTransaction/,
  /walletClient/,
  /privateKeyToAccount/,
  /mnemonicToAccount/,
];

const skipDirs = new Set(['node_modules', 'dist', '.next', '.git', 'coverage']);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('indexer is read-only', () => {
  it('does not introduce signing keys, mnemonics, or transaction sending', () => {
    const files = walk(root);
    const hits: string[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(text)) {
          hits.push(`${file} matches ${pattern}`);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
