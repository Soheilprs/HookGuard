const TYPE_PREFIX =
  /^(?:(?:mapping|uint|int|bool|address|bytes|string|u?fixed)\d*|BeforeSwapDelta|AfterSwapDelta|BalanceDelta)\b/;

const ACCESS_MODIFIERS = new Set([
  'onlyowner',
  'onlyrole',
  'onlyadmin',
  'onlygovernance',
  'requiresauth',
  'restricted',
  'auth',
]);

export interface ExternalCallSite {
  kind: 'call' | 'delegatecall';
  index: number;
  target: string;
}

export interface StateWriteSite {
  index: number;
  text: string;
}

export function findExternalCalls(body: string): ExternalCallSite[] {
  const sites: ExternalCallSite[] = [];
  const pattern =
    /([A-Za-z_][A-Za-z0-9_]*|address\s*\([^)]+\)|payable\s*\([^)]+\))\s*\.(delegatecall|call)\s*(\{|\()/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    const target = (match[1] ?? '').replace(/\s+/g, ' ').trim();
    const kind = match[2] === 'delegatecall' ? 'delegatecall' : 'call';
    sites.push({ kind, index: match.index, target });
  }
  return sites;
}

export function findStateWrites(body: string): StateWriteSite[] {
  const sites: StateWriteSite[] = [];
  const pattern =
    /\b([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]+\])*)\s*(?:\+\+|--|\+=|-=|\|=|&=|\^=|=(?!=))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    const ident = match[1] ?? '';
    const statement = statementAt(body, match.index);
    if (TYPE_PREFIX.test(statement) || /^(?:if|require|assert|return)\b/.test(statement)) {
      continue;
    }
    if (/^(msg|block|tx|abi|type|this|super)\b/.test(ident)) continue;
    sites.push({ index: match.index, text: ident });
  }
  return sites;
}

export function hasAccessControl(fn: {
  modifiers: string[];
  strippedBody: string;
}): boolean {
  if (fn.modifiers.some((item) => ACCESS_MODIFIERS.has(item.toLowerCase()))) {
    return true;
  }
  const body = fn.strippedBody;
  return (
    /\bonlyOwner\b/.test(body) ||
    /\b_checkOwner\s*\(/.test(body) ||
    /\b_checkRole\s*\(/.test(body) ||
    /\bhasRole\s*\(/.test(body) ||
    /\bonlyRole\s*\(/.test(body) ||
    /msg\.sender\s*==\s*(owner|_owner|admin|_admin|governance)/.test(body) ||
    /require\s*\(\s*msg\.sender/.test(body)
  );
}

export function isUnrestrictedTarget(target: string, params: string): boolean {
  const normalized = target.replace(/\s+/g, '');
  if (!normalized) return true;
  if (/^address\(this\)$/i.test(normalized)) return false;
  if (/^payable\(this\)$/i.test(normalized)) return false;
  if (/^address\(0x[a-fA-F0-9]{40}\)$/.test(normalized)) return false;
  if (/^[A-Z][A-Z0-9_]+$/.test(target)) return false;

  const paramNames = params
    .split(',')
    .map((part) => part.trim().split(/\s+/).pop())
    .filter((name): name is string => Boolean(name));

  if (paramNames.includes(target)) return true;
  if (
    /^(sender|to|target|recipient|user|account|callee|hookData)$/i.test(target)
  ) {
    return true;
  }
  if (/^msg\.sender$/i.test(normalized)) return true;
  return false;
}

export function usesCustomAccounting(text: string): boolean {
  return /BeforeSwapDelta|AfterSwapDelta|toBeforeSwapDelta|toAfterSwapDelta/.test(
    text,
  );
}

export function suspiciousAccounting(body: string): boolean {
  if (/abi\s*\.\s*decode\s*\(\s*hookData/.test(body)) return true;
  if (!usesCustomAccounting(body) && !/\b(take|settle)\s*\(/.test(body)) return false;
  if (findExternalCalls(body).length > 0 && usesCustomAccounting(body)) return true;
  if (/wrap\s*\(\s*0\s*\)/.test(body) && !/abi\s*\.\s*decode/.test(body)) return false;
  if (/BeforeSwapDelta\.wrap\(\s*int256\(\s*0\s*\)\s*\)/.test(body)) return false;
  if (/,?\s*int256\(\s*0\s*\)\s*,/.test(body) && !/abi\s*\.\s*decode/.test(body)) return false;
  return usesCustomAccounting(body) && /hookData/.test(body);
}

function statementAt(body: string, index: number): string {
  const from = Math.max(0, body.lastIndexOf(';', index) + 1);
  return body.slice(from, index).trim();
}
