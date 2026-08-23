import type { LandscapeReport } from '../metrics.js';

export function exportLandscapeJson(report: LandscapeReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
