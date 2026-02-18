import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright";
import type { AxeResults, Result, NodeResult } from "axe-core";
import type { AuditViolation } from "../types/audit.js";
import { mapWcagCriteriaToClauseIds } from "../mappings/en301549.js";

const DEFAULT_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export interface AnalysisResult {
  violations: AuditViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

/**
 * Extract WCAG success criteria identifiers from axe-core tags.
 * Tags like "wcag111" map to "1.1.1".
 */
function extractWcagCriteria(tags: string[]): string[] {
  const criteria: string[] = [];
  for (const tag of tags) {
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) {
      criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
    }
  }
  return criteria;
}

/**
 * Run axe-core accessibility analysis on a Playwright page.
 */
export async function analyzePage(
  page: Page,
  tags?: string[]
): Promise<AnalysisResult> {
  const axe = new AxeBuilder({ page }).withTags(tags ?? DEFAULT_TAGS);
  const results: AxeResults = await axe.analyze();

  const violations: AuditViolation[] = results.violations.map((v: Result) => {
    const wcagCriteria = extractWcagCriteria(v.tags);
    const en301549Clauses = mapWcagCriteriaToClauseIds(wcagCriteria);

    return {
      id: v.id,
      impact: (v.impact ?? "minor") as AuditViolation["impact"],
      description: v.description,
      helpUrl: v.helpUrl,
      wcagCriteria,
      en301549Clauses,
      nodes: v.nodes.map((n: NodeResult) => ({
        html: n.html,
        target: n.target.map(String),
        failureSummary: n.failureSummary ?? "",
      })),
    };
  });

  return {
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
  };
}
