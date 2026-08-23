import { OP_CALL, OP_DELEGATECALL, OP_STATICCALL } from '../../bytecode-analysis/disassembler/opcodes.js';
import { analyzeHookBytecode } from '../../bytecode-analysis/program.js';
import type { AnalysisInput } from '../../analysis/types.js';
import { erc20Selector } from '../selectors/erc20.js';
import { classifyTarget, type TargetClass } from '../targets/target-classifier.js';
import { recoverTargetAtCall } from '../targets/address-recovery.js';
import type { CallTargetSource, ExternalCallTarget, StackOrigin } from '../targets/call-target.js';

export interface RecoveredInteraction {
  callback: string;
  entryPc: number;
  pc: number;
  opcode: string;
  target: ExternalCallTarget;
  selector: string | null;
  selectorName: string | null;
  erc20Movement: boolean;
  classification: TargetClass;
  protocolName: string | null;
  path: number[];
  pathLength: number;
}

export function recoverCallbackInteractions(input: AnalysisInput): RecoveredInteraction[] {
  const program = analyzeHookBytecode(input);
  const out: RecoveredInteraction[] = [];
  for (const row of program.reachability) {
    const ops = [...row.call, ...row.delegatecall, ...row.staticcall];
    for (const hit of ops) {
      const opcode =
        hit.opcode === OP_CALL ? OP_CALL : hit.opcode === OP_DELEGATECALL ? OP_DELEGATECALL : OP_STATICCALL;
      const recovered = recoverTargetAtCall(program.cfg, hit.path, hit.pc, opcode);
      const erc20 = erc20Selector(recovered.selector);
      const classified = classifyTarget({
        chainId: input.chainId,
        address: recovered.target.address,
        origin: recovered.target.origin,
        source: recovered.target.source,
        selector: recovered.selector,
      });
      out.push({
        callback: row.callback,
        entryPc: row.entryPc,
        pc: hit.pc,
        opcode: hit.name,
        target: recovered.target,
        selector: recovered.selector,
        selectorName: erc20?.name ?? null,
        erc20Movement: erc20?.movement === true,
        classification: classified.classification,
        protocolName: classified.protocolName,
        path: hit.path,
        pathLength: hit.pathLength,
      });
    }
  }
  return out;
}

export type { CallTargetSource, StackOrigin };
