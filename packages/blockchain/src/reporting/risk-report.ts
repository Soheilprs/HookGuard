import { computeLandscapeMetrics, selectCaseStudies } from './aggregators.js';
import {
  LANDSCAPE_DISCLAIMER,
  type LandscapeReport,
  type ReportCorpus,
} from './metrics.js';

export function buildLandscapeReport(corpus: ReportCorpus): LandscapeReport {
  const generatedAt = corpus.generatedAt;
  return {
    generatedAt,
    disclaimer: LANDSCAPE_DISCLAIMER,
    metrics: computeLandscapeMetrics(corpus),
    caseStudies: selectCaseStudies(corpus),
  };
}

export function assertReportEvidence(report: LandscapeReport): void {
  for (const study of report.caseStudies) {
    if (!study.evidence || Object.keys(study.evidence).length === 0) {
      throw new Error(`Case study ${study.category} is missing evidence`);
    }
  }
}
