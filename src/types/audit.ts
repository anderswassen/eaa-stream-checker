export interface AuditRequest {
  url: string;
  tags?: string[];
  waitForSelector?: string;
  timeout?: number;
}

export type AuditStatus = "pending" | "running" | "completed" | "failed";

export interface ViolationNode {
  html: string;
  target: string[];
  failureSummary: string;
}

export interface AuditViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  helpUrl: string;
  wcagCriteria: string[];
  en301549Clauses: string[];
  nodes: ViolationNode[];
}

export interface AuditResult {
  id: string;
  url: string;
  timestamp: string;
  status: AuditStatus;
  violations: AuditViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  duration?: number;
  error?: string;
}

export interface EN301549Clause {
  id: string;
  title: string;
  wcagMapping?: string;
}

export interface ScanReport {
  audit: AuditResult;
  en301549Summary: {
    clause: string;
    title: string;
    status: "pass" | "fail" | "needs-review" | "not-applicable";
    violations: AuditViolation[];
  }[];
}

export type AuditStore = Map<string, AuditResult>;
