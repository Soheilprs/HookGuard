import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(root, 'apps/api/prisma/schema.prisma');

const requiredModels: Record<string, string[]> = {
  Hook: [
    'id',
    'address',
    'chainId',
    'creator',
    'deploymentBlock',
    'verifiedSource',
    'riskScore',
    'createdAt',
    'firstSeenBlock',
    'lastSeenBlock',
    'poolCount',
    'lastIndexedAt',
  ],
  Pool: [
    'id',
    'poolId',
    'chainId',
    'hookAddress',
    'token0',
    'token1',
    'fee',
    'tickSpacing',
    'createdBlock',
    'token0Address',
    'token1Address',
    'token0Symbol',
    'token1Symbol',
    'createdAtBlock',
    'currencyPair',
  ],
  Contract: [
    'id',
    'address',
    'chainId',
    'bytecode',
    'sourceCode',
    'compilerVersion',
    'bytecodeHash',
    'sourceVerified',
    'sourceUrl',
    'abiJson',
    'isProxy',
    'implementationAddress',
    'adminAddress',
    'lastCheckedAt',
  ],
  ContractFunction: [
    'id',
    'contractId',
    'name',
    'selector',
    'visibility',
    'stateMutability',
  ],
  ContractPermission: ['id', 'contractId', 'type', 'address', 'source'],
  Finding: [
    'id',
    'hookId',
    'ruleId',
    'title',
    'category',
    'severity',
    'description',
    'evidence',
    'createdAt',
  ],
  IndexerCheckpoint: [
    'id',
    'chainId',
    'contractAddress',
    'lastProcessedBlock',
    'updatedAt',
  ],
};

function parseModels(schema: string): Record<string, string[]> {
  const models: Record<string, string[]> = {};
  const modelBlocks = schema.matchAll(/model\s+(\w+)\s+\{([^}]+)\}/g);

  for (const match of modelBlocks) {
    const name = match[1];
    const body = match[2];
    if (!name || !body) continue;
    const fields = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('@@'))
      .map((line) => line.split(/\s+/)[0])
      .filter((field): field is string => Boolean(field));
    models[name] = fields;
  }

  return models;
}

describe('database schema', () => {
  const schema = readFileSync(schemaPath, 'utf8');
  const models = parseModels(schema);

  it('defines registry, intelligence, and checkpoint models', () => {
    expect(Object.keys(models).sort()).toEqual(
      [
        'Contract',
        'ContractFunction',
        'ContractPermission',
        'Finding',
        'Hook',
        'IndexerCheckpoint',
        'Pool',
      ].sort(),
    );
  });

  it('includes required fields on every model', () => {
    for (const [model, fields] of Object.entries(requiredModels)) {
      for (const field of fields) {
        expect(models[model], `${model} is missing`).toBeDefined();
        expect(models[model], `${model}.${field}`).toContain(field);
      }
    }
  });

  it('uses PostgreSQL', () => {
    expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it('passes prisma validate', () => {
    const output = execFileSync(
      'npx',
      ['prisma', 'validate', '--schema', schemaPath],
      {
        cwd: join(root, 'apps/api'),
        env: {
          ...process.env,
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/hookguard',
        },
        encoding: 'utf8',
      },
    );

    expect(output.toLowerCase()).toMatch(/is valid|validated/);
  });
});
