import type { RiskCategory } from '@hookguard/types';
import { RISK_CATEGORIES } from '../analysis/risk/taxonomy.js';

export const LANDSCAPE_CONFIDENCE = ['CONFIRMED', 'STRONG', 'OBSERVED'] as const;
export type LandscapeConfidence = (typeof LANDSCAPE_CONFIDENCE)[number];

export interface ReportFinding {
  hookId: string;
  hookAddress: string;
  chainId: number;
  ruleId: string;
  category: string;
  severity: string;
  confidence: string;
  validationStatus: string;
  impact: string | null;
  affectedComponent: string | null;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
}

export interface ReportHook {
  id: string;
  address: string;
  chainId: number;
  isProxy: boolean;
  findings: ReportFinding[];
}

export interface ReportNetwork {
  id: number;
  slug: string;
  name: string;
}

export interface ReportCorpus {
  generatedAt: string;
  networks: ReportNetwork[];
  hooks: ReportHook[];
  poolsIndexed: number;
  monitoredHooks: number;
  securityEvents: number;
}

export interface CoverageMetrics {
  networks: ReportNetwork[];
  hooksAnalyzed: number;
  poolsIndexed: number;
  findings: number;
  monitoredHooks: number;
  securityEvents: number;
}

export interface CapabilityMetrics {
  beforeSwap: number;
  afterSwap: number;
  beforeAddLiquidity: number;
  afterAddLiquidity: number;
  upgradeable: number;
  privilegedAdmin: number;
  externalExecution: number;
}

export interface LandscapeMetrics {
  coverage: CoverageMetrics;
  riskCategoryHooks: Record<RiskCategory, number>;
  severityFindings: Record<'critical' | 'high' | 'medium' | 'low', number>;
  severityHooks: Record<'critical' | 'high' | 'medium' | 'low', number>;
  confidenceFindings: Record<LandscapeConfidence, number>;
  capabilities: CapabilityMetrics;
}

export interface LandscapeCaseStudy {
  category: RiskCategory;
  ruleId: string;
  hookAddress: string;
  chainId: number;
  title: string;
  impact: string | null;
  evidence: Record<string, unknown>;
}

export interface LandscapeReport {
  generatedAt: string;
  disclaimer: string;
  metrics: LandscapeMetrics;
  caseStudies: LandscapeCaseStudy[];
}

export const LANDSCAPE_DISCLAIMER =
  'HookGuard reports security-relevant capabilities and configurations. Findings are not confirmed exploits, not accusations of malice, and not a numerical risk score. HookGuard does not replace a professional smart-contract audit.';

export const RISK_CATEGORY_LIST: RiskCategory[] = [...RISK_CATEGORIES];
