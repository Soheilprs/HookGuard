const OPS: Record<string, number> = {
  STOP: 0x00,
  ADD: 0x01,
  EQ: 0x14,
  ISZERO: 0x15,
  SHR: 0x1c,
  CALLDATALOAD: 0x35,
  POP: 0x50,
  SSTORE: 0x55,
  JUMP: 0x56,
  JUMPI: 0x57,
  JUMPDEST: 0x5b,
  PUSH0: 0x5f,
  DUP1: 0x80,
  CALL: 0xf1,
  RETURN: 0xf3,
  DELEGATECALL: 0xf4,
  STATICCALL: 0xfa,
  REVERT: 0xfd,
  INVALID: 0xfe,
};

export type Asm =
  | { kind: 'op'; name: string }
  | { kind: 'push'; width: number; value: number | bigint }
  | { kind: 'label'; name: string }
  | { kind: 'pushLabel'; width: number; name: string };

export const op = (name: string): Asm => ({ kind: 'op', name });
export const push = (width: number, value: number | bigint): Asm => ({
  kind: 'push',
  width,
  value,
});
export const label = (name: string): Asm => ({ kind: 'label', name });
export const pushLabel = (width: number, name: string): Asm => ({
  kind: 'pushLabel',
  width,
  name,
});

export function assemble(program: Asm[]): `0x${string}` {
  const labels = new Map<string, number>();
  let pc = 0;
  for (const item of program) {
    if (item.kind === 'label') {
      labels.set(item.name, pc);
      continue;
    }
    if (item.kind === 'op') pc += 1;
    else if (item.kind === 'push') pc += 1 + item.width;
    else pc += 1 + item.width;
  }

  const bytes: number[] = [];
  for (const item of program) {
    if (item.kind === 'label') continue;
    if (item.kind === 'op') {
      const opcode = OPS[item.name];
      if (opcode === undefined) throw new Error(`Unknown op ${item.name}`);
      bytes.push(opcode);
      continue;
    }
    const width = item.width;
    const value =
      item.kind === 'push'
        ? BigInt(item.value)
        : BigInt(labels.get(item.name) ?? fail(`Unknown label ${item.name}`));
    bytes.push(0x5f + width);
    const hex = value.toString(16).padStart(width * 2, '0');
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
    }
  }
  return `0x${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function fail(message: string): never {
  throw new Error(message);
}
