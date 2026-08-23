import { describe, expect, it } from 'vitest';
import { associateCallsWithSource } from './source-calls.js';

const SOURCE = `
contract Hook {
  function afterSwap(address, uint256) external {
    (bool ok,) = token.call(data);
    require(ok);
  }
  function helper() internal {
    target.delegatecall(payload);
  }
}
`;

describe('verified-source call association', () => {
  it('binds CALL to afterSwap and does not invent swap-path reachability elsewhere', () => {
    const hits = associateCallsWithSource(SOURCE);
    const afterSwap = hits.find((hit) => hit.functionName === 'afterSwap');
    const helper = hits.find((hit) => hit.functionName === 'helper');
    expect(afterSwap?.lifecycle).toBe(true);
    expect(afterSwap?.kinds).toContain('call');
    expect(helper?.lifecycle).toBe(false);
    expect(helper?.kinds).toContain('delegatecall');
  });
});
