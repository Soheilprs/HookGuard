import type { InteractionReport } from '../interaction-research.js';

export function exportInteractionJson(report: InteractionReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function exportInteractionMarkdown(report: InteractionReport): string {
  const m = report.metrics;
  return `# HookGuard interaction analysis

Generated at: ${report.generatedAt}

${report.disclaimer}

Findings are **security-relevant execution patterns requiring review**, not confirmed exploits.

## Coverage

| Metric | Count |
| --- | ---: |
| Hooks indexed | ${m.hooksIndexed} |
| Hooks analyzed | ${m.hooksAnalyzed} |
| Callback external calls | ${m.callbackExternalCalls} |
| ERC-20 interactions | ${m.erc20Interactions} |
| Unknown targets | ${m.unknownTargets} |
| User-controlled targets | ${m.userControlled} |
| Known protocol targets | ${m.knownProtocols} |

## Detector results

| Detector | Hooks | Findings |
| --- | ---: | ---: |
| TOKEN_MOVEMENT_IN_CALLBACK | ${m.detectors.TOKEN_MOVEMENT_IN_CALLBACK.hooksAffected} | ${m.detectors.TOKEN_MOVEMENT_IN_CALLBACK.findings} |
| USER_CONTROLLED_EXTERNAL_EXECUTION | ${m.detectors.USER_CONTROLLED_EXTERNAL_EXECUTION.hooksAffected} | ${m.detectors.USER_CONTROLLED_EXTERNAL_EXECUTION.findings} |
| PROTOCOL_INTERACTION | ${m.detectors.PROTOCOL_INTERACTION.hooksAffected} | ${m.detectors.PROTOCOL_INTERACTION.findings} |
| UNKNOWN_EXTERNAL_TARGET | ${m.detectors.UNKNOWN_EXTERNAL_TARGET.hooksAffected} | ${m.detectors.UNKNOWN_EXTERNAL_TARGET.findings} |

## Case studies

${caseStudyIndex(report)}

HookGuard does not replace a professional smart-contract audit.
`;
}

export function renderExternalInteractionAnalysis(report: InteractionReport): string {
  const m = report.metrics;
  return `# Hook external interaction analysis

Generated at: ${report.generatedAt}

${report.disclaimer}

# Executive Summary

HookGuard analyzes how deployed Uniswap v4 hooks interact with external contracts during lifecycle execution.

It recovers CALL targets from bytecode (constant PUSH20, SLOAD, calldata) when a callback-reachable path exists, then classifies only with evidence. It does not claim exploits, malice, or that user funds are at risk.

**HookGuard does not replace a professional smart-contract audit.**

# Methodology

Bytecode
↓
CFG
↓
Callback reachability
↓
CALL target recovery
↓
Selector classification
↓
Security review signal

Target sources: CONSTANT, STORAGE, UNKNOWN. Classifications used only when evidence exists: KNOWN_PROTOCOL, TOKEN_CONTRACT, UNKNOWN_CONTRACT, USER_CONTROLLED, DYNAMIC.

# Findings

| Metric | Count |
| --- | ---: |
| Hooks analyzed | ${m.hooksAnalyzed} |
| Callback external calls | ${m.callbackExternalCalls} |
| ERC20 interactions | ${m.erc20Interactions} |
| Unknown targets | ${m.unknownTargets} |
| User-controlled targets | ${m.userControlled} |
| Known protocols | ${m.knownProtocols} |

Machine output: \`reports/hookguard-interaction-analysis.md\`.

# Limitations

- Bytecode CFG does not follow unresolved dynamic jumps.
- PUSH4 before CALL is a heuristic selector; it may not be the calldata selector actually stored in memory.
- Storage-loaded addresses have no value unless the slot is a constant.
- Protocol names are assigned only from a curated address list. Unknown constants stay unclassified as protocols.
- No exploit claims.

Regenerate with \`npm run analyze:interactions\`.
`;
}

export function renderBehaviorLandscape(report: InteractionReport): string {
  const m = report.metrics;
  return `# Hook behavior landscape

Generated at: ${report.generatedAt}

Public ecosystem report of **observed** Uniswap v4 hook external interactions. Not user counts, TVL, or exploit proofs.

${report.disclaimer}

## External dependency statistics

| | |
| --- | ---: |
| Hooks analyzed | ${m.hooksAnalyzed} |
| Callbacks that CALL | ${m.callbackExternalCalls} |
| Known protocol matches | ${m.knownProtocols} |
| ERC-20 movement selectors | ${m.erc20Interactions} |
| Unknown / dynamic targets | ${m.unknownTargets} |
| Calldata-derived targets | ${m.userControlled} |

## Most common interactions

${commonInteractions(report)}

## Callback behavior

Interaction findings are bound to recovered lifecycle callbacks (typically \`beforeSwap\` / \`afterSwap\`) when dispatcher + CFG path exist.

## Examples

${caseStudyIndex(report)}

HookGuard does not replace a professional smart-contract audit.
`;
}

export function renderInteractionCaseStudies(report: InteractionReport): string {
  if (report.caseStudies.length === 0) {
    return `# Hook interaction case studies

Generated at: ${report.generatedAt}

${report.disclaimer}

No strong examples exist in this corpus (no recovered constant target, ERC-20 selector, calldata-derived target, or curated protocol match on a callback path). This is not filled with invented addresses.

HookGuard does not replace a professional smart-contract audit.
`;
  }

  const sections = report.caseStudies.map((item, index) => {
    return `## ${index + 1}. ${item.detector}

**Hook address:** \`${item.hookAddress}\`  
**Network:** ${item.network} (${item.chainId})  
**Callback:** ${item.callback ?? '—'}  
**Target:** ${item.targetAddress ?? 'unrecovered'}  
**Operation:** ${item.opcode ?? 'CALL'} ${item.selectorName ? `(${item.selectorName} ${item.selector})` : item.selector ?? ''}  
**Classification:** ${item.targetType ?? '—'}  
**Confidence:** ${item.confidence}

### Evidence

- pc: ${item.pc ?? '—'}
- selector: ${item.selector ?? '—'}
- protocol: ${item.protocolName ?? '—'}

### Why it matters

${item.whyItMatters}

### Recommended review

${item.reviewActions.map((step) => `- [ ] ${step}`).join('\n')}
`;
  });

  return `# Hook interaction case studies

Generated at: ${report.generatedAt}

Automatically selected from recovered callback CALLs. Addresses identify contracts, not people. These are **security-relevant execution patterns requiring review**, not confirmed exploits.

${report.disclaimer}

${sections.join('\n---\n\n')}
HookGuard does not replace a professional smart-contract audit.
`;
}

function caseStudyIndex(report: InteractionReport): string {
  if (report.caseStudies.length === 0) {
    return 'No strong examples exist in this corpus. None were fabricated.';
  }
  return report.caseStudies
    .map(
      (item) =>
        `- \`${item.hookAddress}\` ${item.detector} callback=${item.callback ?? '—'} target=${item.targetAddress ?? '—'}`,
    )
    .join('\n');
}

function commonInteractions(report: InteractionReport): string {
  const counts = new Map<string, number>();
  for (const item of report.findings) {
    const key = item.protocolName || item.selectorName || item.targetType || item.detector;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (rows.length === 0) return 'No classified interactions in this snapshot.';
  return rows.map(([name, count]) => `- ${name}: ${count}`).join('\n');
}
