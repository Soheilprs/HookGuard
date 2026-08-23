const LIFECYCLE = [
  'beforeinitialize',
  'afterinitialize',
  'beforeswap',
  'afterswap',
  'beforeaddliquidity',
  'afteraddliquidity',
  'beforeremoveliquidity',
  'afterremoveliquidity',
  'beforemodifyliquidity',
  'aftermodifyliquidity',
  'beforedonate',
  'afterdonate',
];

export type SourceCallKind = 'call' | 'delegatecall' | 'staticcall';

export interface SourceCallHit {
  functionName: string;
  kinds: SourceCallKind[];
  lifecycle: boolean;
}

export function flattenVerifiedSource(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const candidate = trimmed.startsWith('{{') ? trimmed.slice(1, -1) : trimmed;
  if (candidate.startsWith('{')) {
    try {
      const parsed = JSON.parse(candidate) as {
        sources?: Record<string, { content?: string } | string>;
      };
      if (parsed.sources && typeof parsed.sources === 'object') {
        return Object.values(parsed.sources)
          .map((entry) => (typeof entry === 'string' ? entry : entry.content ?? ''))
          .join('\n\n');
      }
    } catch {
      // Fall through to raw text.
    }
  }
  return raw;
}

export function stripSolidityComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');
}

export function associateCallsWithSource(sourceCode: string | null): SourceCallHit[] {
  if (!sourceCode) return [];
  const source = stripSolidityComments(flattenVerifiedSource(sourceCode));
  const hits: SourceCallHit[] = [];
  const pattern = /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const name = match[1];
    if (!name) continue;
    const brace = source.indexOf('{', match.index);
    if (brace < 0) continue;
    const body = extractBraceBody(source, brace);
    if (!body) continue;
    const kinds = detectCallKinds(body);
    if (kinds.length === 0) continue;
    hits.push({
      functionName: name,
      kinds,
      lifecycle: LIFECYCLE.includes(name.toLowerCase()),
    });
  }
  return hits;
}

function extractBraceBody(source: string, openIndex: number): string | null {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  return null;
}

function detectCallKinds(body: string): SourceCallKind[] {
  const kinds: SourceCallKind[] = [];
  if (/\bdelegatecall\b/i.test(body)) kinds.push('delegatecall');
  if (/\bstaticcall\b/i.test(body)) kinds.push('staticcall');
  if (/\.call\s*(\(|\{)/.test(body) || /\bcall\s*\(/.test(body)) {
    kinds.push('call');
  }
  return kinds;
}
