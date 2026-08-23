import { describe, expect, it } from 'vitest';
import { InMemoryFindingRepository } from './finding.repository.js';

const SAMPLE = {
  hookId: 'hook-1',
  ruleId: 'proxy-used',
  title: 'Hook is deployed behind a proxy',
  category: 'upgradeability',
  severity: 'info',
  description: 'Proxy detected.',
  evidence: { kind: 'transparent' },
};

describe('finding persistence', () => {
  it('does not duplicate findings for the same hook and rule', async () => {
    const repo = new InMemoryFindingRepository();
    await repo.replaceForHook('hook-1', ['proxy-used'], [SAMPLE]);
    await repo.replaceForHook('hook-1', ['proxy-used'], [
      { ...SAMPLE, evidence: { kind: 'uups' } },
    ]);

    const rows = await repo.listByHookId('hook-1');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.evidence.kind).toBe('uups');
    expect(rows[0]?.id).toBeTruthy();
  });

  it('drops stale engine findings that no longer apply', async () => {
    const repo = new InMemoryFindingRepository();
    await repo.replaceForHook('hook-1', ['proxy-used', 'ext-call'], [
      SAMPLE,
      { ...SAMPLE, ruleId: 'ext-call', title: 'CALL present' },
    ]);
    await repo.replaceForHook('hook-1', ['proxy-used', 'ext-call'], [SAMPLE]);

    const rows = await repo.listByHookId('hook-1');
    expect(rows.map((row) => row.ruleId)).toEqual(['proxy-used']);
  });
});
