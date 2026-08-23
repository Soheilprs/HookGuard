import type { AnalysisResearchReport } from '../analysis-research.js';

export function exportAnalysisResearchJson(report: AnalysisResearchReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
