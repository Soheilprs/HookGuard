import { CAPABILITY_DISCLAIMER } from '../analysis/risk/taxonomy.js';
import type { EngineFinding } from '../analysis/types.js';
import { BYTECODE_CFG } from '../bytecode-analysis/program.js';
import type { RecoveredInteraction } from './analysis/external-calls.js';

export function interactionFinding(
  partial: Omit<EngineFinding, 'detectionSource' | 'analysisType' | 'description'> & {
    description: string;
  },
): EngineFinding {
  return {
    ...partial,
    detectionSource: 'BYTECODE_OPCODE',
    analysisType: BYTECODE_CFG,
    description: `${partial.description} ${CAPABILITY_DISCLAIMER}`,
  };
}

export function interactionEvidence(
  item: RecoveredInteraction,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    analysisType: BYTECODE_CFG,
    callback: item.callback,
    entryPc: item.entryPc,
    opcode: item.opcode,
    pc: item.pc,
    path: item.path,
    pathLength: item.pathLength,
    targetAddress: item.target.address,
    targetSource: item.target.source,
    targetOrigin: item.target.origin,
    targetType: item.classification,
    selector: item.selector,
    selectorName: item.selectorName,
    protocolName: item.protocolName,
    ...extra,
  };
}
