import type { AuditResult } from "../types/audit.js";
import { getAllClause9Mappings } from "../mappings/en301549.js";

/**
 * Compute the compliance score based on EN 301 549 clause mapping.
 * This is the single source of truth for score calculation across the app.
 *
 * Score = (passed clauses / total clauses) * 100
 *
 * Web clauses: all Clause 9 mappings, fail if any axe violation maps to them
 * Video clauses: from streaming analysis findings
 */
export function computeClauseScore(audit: AuditResult): number | null {
  if (audit.status !== "completed") return null;

  // Build web clauses (Clause 9) from axe violations
  const clause9Mappings = getAllClause9Mappings();
  const violatedClauseIds = new Set<string>();
  for (const v of audit.violations) {
    for (const clauseId of v.en301549Clauses) {
      violatedClauseIds.add(clauseId);
    }
  }

  const webClauses = Object.values(clause9Mappings).map((clause) => ({
    status: violatedClauseIds.has(clause.id) ? "fail" : "pass",
  }));

  // Build video clauses (Clause 7) from streaming findings
  const videoClauses = (audit.streaming?.findings ?? []).map((f) => ({
    status: f.status,
  }));

  const allClauses = [...videoClauses, ...webClauses];
  if (allClauses.length === 0) return null;

  const passed = allClauses.filter((c) => c.status === "pass").length;
  return Math.round((passed / allClauses.length) * 100);
}

/**
 * Get clause-based counts for database storage.
 */
export function computeClauseCounts(audit: AuditResult): {
  passed: number;
  failed: number;
  needsReview: number;
  totalChecks: number;
} {
  const clause9Mappings = getAllClause9Mappings();
  const violatedClauseIds = new Set<string>();
  for (const v of audit.violations) {
    for (const clauseId of v.en301549Clauses) {
      violatedClauseIds.add(clauseId);
    }
  }

  const webClauses = Object.values(clause9Mappings).map((clause) => ({
    status: violatedClauseIds.has(clause.id) ? "fail" as const : "pass" as const,
  }));

  const videoClauses = (audit.streaming?.findings ?? []).map((f) => ({
    status: f.status,
  }));

  const allClauses = [...videoClauses, ...webClauses];
  const passed = allClauses.filter((c) => c.status === "pass").length;
  const failed = allClauses.filter((c) => c.status === "fail").length;
  const needsReview = allClauses.filter((c) => c.status === "needs_review").length;

  return { passed, failed, needsReview, totalChecks: allClauses.length };
}
