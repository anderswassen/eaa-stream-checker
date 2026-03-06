import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright-core";
import type { AxeResults, Result, NodeResult } from "axe-core";
import type { AuditViolation } from "../types/audit.js";
import { mapWcagCriteriaToClauseIds } from "../mappings/en301549.js";
import { screenshotElement } from "./crawler.js";

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
  tags?: string[],
  options?: { captureScreenshots?: boolean; pageUrl?: string }
): Promise<AnalysisResult> {
  const axe = new AxeBuilder({ page }).withTags(tags ?? DEFAULT_TAGS);
  const results: AxeResults = await axe.analyze();
  const doScreenshots = options?.captureScreenshots ?? true;

  const violations: AuditViolation[] = [];

  for (const v of results.violations) {
    const wcagCriteria = extractWcagCriteria(v.tags);
    const en301549Clauses = mapWcagCriteriaToClauseIds(wcagCriteria);

    const nodes = [];
    for (let i = 0; i < v.nodes.length; i++) {
      const n = v.nodes[i];
      let screenshot: string | undefined;
      // Capture screenshots for first 3 nodes per violation
      if (doScreenshots && i < 3 && n.target.length > 0) {
        screenshot = await screenshotElement(page, String(n.target[0]));
      }
      nodes.push({
        html: n.html,
        target: n.target.map(String),
        failureSummary: n.failureSummary ?? "",
        screenshot,
        pageUrl: options?.pageUrl,
      });
    }

    violations.push({
      id: v.id,
      impact: (v.impact ?? "minor") as AuditViolation["impact"],
      description: v.description,
      helpUrl: v.helpUrl,
      wcagCriteria,
      en301549Clauses,
      nodes,
    });
  }

  return {
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
  };
}
