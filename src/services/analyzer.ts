import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright-core";
import type { AxeResults, Result, NodeResult } from "axe-core";
import type { AuditViolation } from "../types/audit.js";
import { mapWcagCriteriaToClauseIds } from "../mappings/en301549.js";
import { screenshotElement } from "./crawler.js";

const DEFAULT_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const AXE_TIMEOUT_MS = 90000;

export interface AnalysisResult {
  violations: AuditViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  colorContrastSkipped: boolean;
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

function buildAxe(page: Page, tags: string[], disableColorContrast: boolean): AxeBuilder {
  const axe = new AxeBuilder({ page })
    .withTags(tags)
    .exclude("iframe")
    .exclude("[aria-hidden='true']");
  if (disableColorContrast) {
    // color-contrast is the slowest axe rule by far — disable it on heavy pages so we don't time out.
    axe.disableRules(["color-contrast"]);
  }
  return axe;
}

/**
 * Run axe-core accessibility analysis on a Playwright page.
 * On timeout, retries once with color-contrast disabled (the slowest rule on heavy DOMs).
 */
export async function analyzePage(
  page: Page,
  tags?: string[],
  options?: { captureScreenshots?: boolean; pageUrl?: string; disableColorContrast?: boolean }
): Promise<AnalysisResult> {
  const effectiveTags = tags ?? DEFAULT_TAGS;
  let colorContrastSkipped = options?.disableColorContrast ?? false;

  let results: AxeResults;
  try {
    results = await withTimeout(
      buildAxe(page, effectiveTags, colorContrastSkipped).analyze(),
      AXE_TIMEOUT_MS,
      "axe-core analysis"
    );
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes("timed out");
    if (!isTimeout || colorContrastSkipped) throw err;
    console.warn(`[analyzer] axe-core timed out after ${AXE_TIMEOUT_MS / 1000}s; retrying without color-contrast`);
    colorContrastSkipped = true;
    results = await withTimeout(
      buildAxe(page, effectiveTags, true).analyze(),
      AXE_TIMEOUT_MS,
      "axe-core analysis"
    );
  }

  const doScreenshots = options?.captureScreenshots ?? true;

  const violations: AuditViolation[] = [];
  let totalScreenshots = 0;
  const MAX_SCREENSHOTS = 15; // Cap total screenshots to avoid slow scans on heavy sites

  for (const v of results.violations) {
    const wcagCriteria = extractWcagCriteria(v.tags);
    const en301549Clauses = mapWcagCriteriaToClauseIds(wcagCriteria);

    const nodes = [];
    const maxNodes = Math.min(v.nodes.length, 10); // Cap nodes per violation
    for (let i = 0; i < maxNodes; i++) {
      const n = v.nodes[i];
      let screenshot: string | undefined;
      // Capture screenshots for first 2 nodes per violation, up to global cap
      if (doScreenshots && i < 2 && totalScreenshots < MAX_SCREENSHOTS && n.target.length > 0) {
        screenshot = await screenshotElement(page, String(n.target[0]));
        if (screenshot) totalScreenshots++;
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
    colorContrastSkipped,
  };
}
