import type { RecoveredInteraction } from './external-calls.js';

export interface ProtocolDependency {
  protocolName: string;
  address: string;
  callbacks: string[];
}

export function protocolDependencies(calls: RecoveredInteraction[]): ProtocolDependency[] {
  const map = new Map<string, ProtocolDependency>();
  for (const item of calls) {
    if (item.classification !== 'KNOWN_PROTOCOL' || !item.protocolName || !item.target.address) {
      continue;
    }
    const key = `${item.protocolName}:${item.target.address}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.callbacks.includes(item.callback)) existing.callbacks.push(item.callback);
    } else {
      map.set(key, {
        protocolName: item.protocolName,
        address: item.target.address,
        callbacks: [item.callback],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.protocolName.localeCompare(b.protocolName));
}
