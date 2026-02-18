export interface Finding {
  description: string;
  evidence?: string;
  screenshot?: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface Clause {
  clauseId: string;
  title: string;
  category: 'video' | 'web_content';
  status: 'pass' | 'fail' | 'needs_review' | 'not_applicable';
  findings: Finding[];
  recommendation?: string;
}

export interface ScanReport {
  id: string;
  url: string;
  scannedAt: string;
  status: 'completed' | 'in_progress' | 'failed';
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    needsReview: number;
    overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
  };
  clauses: Clause[];
}
