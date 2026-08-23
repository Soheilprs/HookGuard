export const OP_STOP = 0x00;
export const OP_JUMP = 0x56;
export const OP_JUMPI = 0x57;
export const OP_JUMPDEST = 0x5b;
export const OP_PUSH0 = 0x5f;
export const OP_PUSH1 = 0x60;
export const OP_PUSH32 = 0x7f;
export const OP_DUP1 = 0x80;
export const OP_SWAP1 = 0x90;
export const OP_SSTORE = 0x55;
export const OP_CALL = 0xf1;
export const OP_CALLCODE = 0xf2;
export const OP_RETURN = 0xf3;
export const OP_DELEGATECALL = 0xf4;
export const OP_STATICCALL = 0xfa;
export const OP_REVERT = 0xfd;
export const OP_INVALID = 0xfe;
export const OP_SELFDESTRUCT = 0xff;

const NAMES: Record<number, string> = {
  0x00: 'STOP',
  0x01: 'ADD',
  0x02: 'MUL',
  0x03: 'SUB',
  0x04: 'DIV',
  0x05: 'SDIV',
  0x06: 'MOD',
  0x07: 'SMOD',
  0x08: 'ADDMOD',
  0x09: 'MULMOD',
  0x0a: 'EXP',
  0x0b: 'SIGNEXTEND',
  0x10: 'LT',
  0x11: 'GT',
  0x12: 'SLT',
  0x13: 'SGT',
  0x14: 'EQ',
  0x15: 'ISZERO',
  0x16: 'AND',
  0x17: 'OR',
  0x18: 'XOR',
  0x19: 'NOT',
  0x1a: 'BYTE',
  0x1b: 'SHL',
  0x1c: 'SHR',
  0x1d: 'SAR',
  0x20: 'KECCAK256',
  0x30: 'ADDRESS',
  0x31: 'BALANCE',
  0x32: 'ORIGIN',
  0x33: 'CALLER',
  0x34: 'CALLVALUE',
  0x35: 'CALLDATALOAD',
  0x36: 'CALLDATASIZE',
  0x37: 'CALLDATACOPY',
  0x38: 'CODESIZE',
  0x39: 'CODECOPY',
  0x3a: 'GASPRICE',
  0x3b: 'EXTCODESIZE',
  0x3c: 'EXTCODECOPY',
  0x3d: 'RETURNDATASIZE',
  0x3e: 'RETURNDATACOPY',
  0x3f: 'EXTCODEHASH',
  0x40: 'BLOCKHASH',
  0x41: 'COINBASE',
  0x42: 'TIMESTAMP',
  0x43: 'NUMBER',
  0x44: 'PREVRANDAO',
  0x45: 'GASLIMIT',
  0x46: 'CHAINID',
  0x47: 'SELFBALANCE',
  0x48: 'BASEFEE',
  0x50: 'POP',
  0x51: 'MLOAD',
  0x52: 'MSTORE',
  0x53: 'MSTORE8',
  0x54: 'SLOAD',
  0x55: 'SSTORE',
  0x56: 'JUMP',
  0x57: 'JUMPI',
  0x58: 'PC',
  0x59: 'MSIZE',
  0x5a: 'GAS',
  0x5b: 'JUMPDEST',
  0x5f: 'PUSH0',
  0xf0: 'CREATE',
  0xf1: 'CALL',
  0xf2: 'CALLCODE',
  0xf3: 'RETURN',
  0xf4: 'DELEGATECALL',
  0xf5: 'CREATE2',
  0xfa: 'STATICCALL',
  0xfd: 'REVERT',
  0xfe: 'INVALID',
  0xff: 'SELFDESTRUCT',
};

export function opcodeName(opcode: number): string {
  if (opcode >= OP_PUSH1 && opcode <= OP_PUSH32) {
    return `PUSH${opcode - 0x5f}`;
  }
  if (opcode >= OP_DUP1 && opcode <= 0x8f) return `DUP${opcode - 0x7f}`;
  if (opcode >= OP_SWAP1 && opcode <= 0x9f) return `SWAP${opcode - 0x8f}`;
  if (opcode >= 0xa0 && opcode <= 0xa4) return `LOG${opcode - 0xa0}`;
  return NAMES[opcode] ?? `UNKNOWN_0x${opcode.toString(16)}`;
}

export function isPush(opcode: number): boolean {
  return opcode >= OP_PUSH0 && opcode <= OP_PUSH32;
}

export function pushWidth(opcode: number): number {
  if (opcode === OP_PUSH0) return 0;
  if (opcode >= OP_PUSH1 && opcode <= OP_PUSH32) return opcode - 0x5f;
  return 0;
}

export function isJumpdest(opcode: number): boolean {
  return opcode === OP_JUMPDEST;
}

export function isJump(opcode: number): boolean {
  return opcode === OP_JUMP;
}

export function isJumpi(opcode: number): boolean {
  return opcode === OP_JUMPI;
}

export function isTerminal(opcode: number): boolean {
  return (
    opcode === OP_STOP ||
    opcode === OP_JUMP ||
    opcode === OP_RETURN ||
    opcode === OP_REVERT ||
    opcode === OP_INVALID ||
    opcode === OP_SELFDESTRUCT
  );
}

/** pop count, push count. Conservative 0/0 for unknown. */
export function stackDelta(opcode: number): { pop: number; push: number } {
  if (opcode === OP_PUSH0 || (opcode >= OP_PUSH1 && opcode <= OP_PUSH32)) {
    return { pop: 0, push: 1 };
  }
  if (opcode >= OP_DUP1 && opcode <= 0x8f) return { pop: 0, push: 1 };
  if (opcode >= OP_SWAP1 && opcode <= 0x9f) return { pop: 0, push: 0 };
  if (opcode >= 0xa0 && opcode <= 0xa4) return { pop: opcode - 0xa0 + 2, push: 0 };

  switch (opcode) {
    case OP_STOP:
    case OP_JUMPDEST:
    case 0xfe:
      return { pop: 0, push: 0 };
    case 0x15:
    case 0x19:
    case 0x30:
    case 0x32:
    case 0x33:
    case 0x34:
    case 0x36:
    case 0x38:
    case 0x3a:
    case 0x3d:
    case 0x41:
    case 0x42:
    case 0x43:
    case 0x44:
    case 0x45:
    case 0x46:
    case 0x47:
    case 0x48:
    case 0x58:
    case 0x59:
    case 0x5a:
      return { pop: 0, push: 1 };
    case 0x50:
      return { pop: 1, push: 0 };
    case 0x31:
    case 0x35:
    case 0x3b:
    case 0x3f:
    case 0x40:
    case 0x51:
    case 0x54:
      return { pop: 1, push: 1 };
    case 0x52:
    case 0x53:
    case OP_SSTORE:
    case OP_JUMP:
    case OP_RETURN:
    case OP_REVERT:
      return { pop: 2, push: 0 };
    case OP_JUMPI:
    case 0x37:
    case 0x39:
      return { pop: 3, push: 0 };
    case 0x01:
    case 0x02:
    case 0x03:
    case 0x04:
    case 0x05:
    case 0x06:
    case 0x07:
    case 0x0a:
    case 0x0b:
    case 0x10:
    case 0x11:
    case 0x12:
    case 0x13:
    case 0x14:
    case 0x16:
    case 0x17:
    case 0x18:
    case 0x1a:
    case 0x1b:
    case 0x1c:
    case 0x1d:
    case 0x20:
      return { pop: 2, push: 1 };
    case 0x08:
    case 0x09:
      return { pop: 3, push: 1 };
    case 0x3c:
    case 0x3e:
      return { pop: 4, push: 0 };
    case OP_SELFDESTRUCT:
      return { pop: 1, push: 0 };
    case 0xf0:
      return { pop: 3, push: 1 };
    case OP_CALL:
    case OP_CALLCODE:
      return { pop: 7, push: 1 };
    case OP_DELEGATECALL:
    case OP_STATICCALL:
      return { pop: 6, push: 1 };
    case 0xf5:
      return { pop: 4, push: 1 };
    default:
      return { pop: 0, push: 0 };
  }
}
