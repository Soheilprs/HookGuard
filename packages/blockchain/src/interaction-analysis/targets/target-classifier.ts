import { erc20Selector } from '../selectors/erc20.js';
import { knownProtocol } from '../selectors/protocols.js';
import type { CallTargetSource, StackOrigin } from './call-target.js';

export type TargetClass =
  | 'KNOWN_PROTOCOL'
  | 'TOKEN_CONTRACT'
  | 'UNKNOWN_CONTRACT'
  | 'USER_CONTROLLED'
  | 'DYNAMIC';

export function classifyTarget(input: {
  chainId: number;
  address: string | null;
  origin: StackOrigin;
  source: CallTargetSource;
  selector: string | null;
}): { classification: TargetClass; protocolName: string | null } {
  if (input.origin === 'CALLDATA') {
    return { classification: 'USER_CONTROLLED', protocolName: null };
  }
  if (input.origin === 'UNKNOWN' && !input.address) {
    return { classification: 'DYNAMIC', protocolName: null };
  }
  if (input.address) {
    const protocol = knownProtocol(input.chainId, input.address);
    if (protocol) {
      return { classification: 'KNOWN_PROTOCOL', protocolName: protocol.name };
    }
  }
  if (erc20Selector(input.selector) && (input.address || input.source === 'CONSTANT')) {
    return { classification: 'TOKEN_CONTRACT', protocolName: null };
  }
  if (input.source === 'CONSTANT' && input.address) {
    return { classification: 'UNKNOWN_CONTRACT', protocolName: null };
  }
  if (input.source === 'STORAGE') {
    return { classification: 'DYNAMIC', protocolName: null };
  }
  return { classification: 'DYNAMIC', protocolName: null };
}
