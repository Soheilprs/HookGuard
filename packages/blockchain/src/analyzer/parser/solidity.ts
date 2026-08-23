import { flattenVerifiedSource, stripSolidityComments } from '../../analysis/source-calls.js';

export interface ParsedFunction {
  name: string;
  visibility: 'public' | 'external' | 'internal' | 'private' | 'unknown';
  modifiers: string[];
  params: string;
  returns: string;
  body: string;
  strippedBody: string;
  snippet: string;
  sourceLocation: string;
  startLine: number;
  endLine: number;
}

const VISIBILITY = new Set(['public', 'external', 'internal', 'private']);
const HEADER_SKIP = new Set([
  'public',
  'external',
  'internal',
  'private',
  'view',
  'pure',
  'payable',
  'virtual',
  'override',
  'returns',
  'memory',
  'calldata',
  'storage',
]);

export function parseSolidityFunctions(sourceCode: string | null | undefined): ParsedFunction[] {
  if (!sourceCode) return [];
  const source = flattenVerifiedSource(sourceCode);
  const functions: ParsedFunction[] = [];
  const pattern = /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const name = match[1];
    if (!name) continue;
    const paramsOpen = match.index + match[0].length - 1;
    const paramsClose = matchParen(source, paramsOpen);
    if (paramsClose < 0) continue;
    const afterParams = source.slice(paramsClose + 1);
    const bodyRel = afterParams.search(/[{;]/);
    if (bodyRel < 0) continue;
    const marker = afterParams[bodyRel];
    if (marker === ';') continue;
    const bodyOpen = paramsClose + 1 + bodyRel;
    const body = extractBraceBody(source, bodyOpen);
    if (body === null) continue;
    const bodyClose = bodyOpen + body.length + 1;
    const header = afterParams.slice(0, bodyRel);
    const visibility = parseVisibility(header);
    if (visibility === 'internal' || visibility === 'private') continue;
    const startLine = indexToLine(source, match.index);
    const endLine = indexToLine(source, bodyClose);
    const snippet = trimSnippet(source.slice(match.index, Math.min(bodyClose + 1, source.length)));
    functions.push({
      name,
      visibility,
      modifiers: parseModifiers(header),
      params: source.slice(paramsOpen + 1, paramsClose).trim(),
      returns: parseReturns(header),
      body,
      strippedBody: stripSolidityComments(body),
      snippet,
      sourceLocation: `L${startLine}-L${endLine}`,
      startLine,
      endLine,
    });
  }
  return functions;
}

export function indexToLine(source: string, index: number): number {
  let line = 1;
  const limit = Math.min(Math.max(index, 0), source.length);
  for (let i = 0; i < limit; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

export function extractBraceBody(source: string, openIndex: number): string | null {
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

function matchParen(source: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '(') depth += 1;
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseVisibility(
  header: string,
): ParsedFunction['visibility'] {
  for (const token of tokenize(header)) {
    if (VISIBILITY.has(token)) return token as ParsedFunction['visibility'];
  }
  return 'unknown';
}

function parseModifiers(header: string): string[] {
  const modifiers: string[] = [];
  const cleaned = header.replace(/returns\s*\([^)]*\)/g, ' ');
  for (const token of tokenize(cleaned)) {
    const name = token.replace(/\(.*$/, '');
    if (!name || HEADER_SKIP.has(name)) continue;
    modifiers.push(name);
  }
  return modifiers;
}

function parseReturns(header: string): string {
  const match = header.match(/returns\s*\(([^)]*)\)/);
  return match?.[1]?.trim() ?? '';
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function trimSnippet(text: string): string {
  const lines = text.replace(/\s+$/, '').split('\n');
  if (lines.length <= 40) return lines.join('\n').trim();
  return `${lines.slice(0, 40).join('\n')}\n// …`;
}
