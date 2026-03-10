import type { FastifyInstance } from "fastify";
import type { AuditStore, AuditViolation } from "../types/audit.js";
import { isPersistedStore } from "../store/index.js";
import { getAllClause9Mappings } from "../mappings/en301549.js";
import type { StreamingFinding } from "../services/streaming/types.js";

/**
 * Frontend-aligned report format.
 * Matches frontend/src/types/report.ts exactly.
 */
interface Finding {
  description: string;
  evidence?: string;
  screenshot?: string;
  pageUrl?: string;
  severity: "critical" | "major" | "minor";
}

interface Clause {
  clauseId: string;
  title: string;
  category: "video" | "web_content";
  status: "pass" | "fail" | "needs_review" | "not_applicable";
  findings: Finding[];
  recommendation?: string;
  helpText?: string;
  wcagMapping?: string;
  wcag22Only?: boolean;
}

interface PageScanned {
  url: string;
  title: string;
  violationCount: number;
}

interface FrontendScanReport {
  id: string;
  url: string;
  scannedAt: string;
  status: "completed" | "in_progress" | "failed";
  deepScan?: boolean;
  pagesScanned?: PageScanned[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    needsReview: number;
    overallStatus: "compliant" | "non_compliant" | "partially_compliant";
  };
  clauses: Clause[];
}

function mapImpactToSeverity(
  impact: AuditViolation["impact"]
): Finding["severity"] {
  switch (impact) {
    case "critical":
    case "serious":
      return "critical";
    case "moderate":
      return "major";
    default:
      return "minor";
  }
}

export async function reportRoutes(app: FastifyInstance, store: AuditStore) {
  app.get<{ Params: { id: string } }>("/report/:id", async (request, reply) => {
    // Use async get for PersistentStore (can fetch from PG if not in cache)
    const audit = isPersistedStore(store)
      ? await store.getAsync(request.params.id)
      : store.get(request.params.id);
    if (!audit) {
      return reply.status(404).send({ error: "Scan not found" });
    }

    if (audit.status !== "completed") {
      return reply.status(409).send({
        error: "Scan not yet completed",
        status: audit.status,
      });
    }

    // Build Clause 9 (web content) clauses from axe-core violations
    const clause9Mappings = getAllClause9Mappings();
    const clauseViolations = new Map<string, AuditViolation[]>();
    for (const v of audit.violations) {
      for (const clauseId of v.en301549Clauses) {
        const list = clauseViolations.get(clauseId) ?? [];
        list.push(v);
        clauseViolations.set(clauseId, list);
      }
    }

    const webClauses: Clause[] = Object.values(clause9Mappings).map(
      (clause) => {
        const violations = clauseViolations.get(clause.id) ?? [];
        const findings: Finding[] = violations.map((v) => {
          // Use first node's screenshot if available
          const firstScreenshot = v.nodes.find((n) => n.screenshot)?.screenshot;
          const firstPageUrl = v.nodes.find((n) => n.pageUrl)?.pageUrl;
          return {
            description: v.description,
            evidence: v.nodes.map((n) => n.html).join("\n"),
            screenshot: firstScreenshot,
            pageUrl: firstPageUrl,
            severity: mapImpactToSeverity(v.impact),
          };
        });

        return {
          clauseId: clause.id,
          title: clause.title,
          category: "web_content" as const,
          status: violations.length > 0 ? ("fail" as const) : ("pass" as const),
          findings,
          helpText: clause.helpText,
          ...(clause.wcagMapping && { wcagMapping: clause.wcagMapping }),
          ...(clause.wcag22Only && { wcag22Only: true }),
        };
      }
    );

    // Build Clause 7 (video/streaming) clauses from streaming analysis
    const videoClauses: Clause[] = [];
    if (audit.streaming) {
      for (const finding of audit.streaming.findings) {
        // Group by clauseId (there's one finding per clause from the mapper)
        videoClauses.push({
          clauseId: finding.clauseId,
          title: finding.clauseTitle,
          category: "video",
          status: finding.status,
          findings: [
            {
              description: finding.description,
              evidence: finding.evidence,
              severity: finding.severity,
            },
          ],
          helpText: finding.helpText,
        });
      }
    }

    const allClauses = [...videoClauses, ...webClauses];
    const passed = allClauses.filter((c) => c.status === "pass").length;
    const failed = allClauses.filter((c) => c.status === "fail").length;
    const needsReview = allClauses.filter(
      (c) => c.status === "needs_review"
    ).length;

    let overallStatus: FrontendScanReport["summary"]["overallStatus"];
    if (failed === 0 && needsReview === 0) {
      overallStatus = "compliant";
    } else if (failed > 0) {
      overallStatus = "non_compliant";
    } else {
      overallStatus = "partially_compliant";
    }

    const report: FrontendScanReport = {
      id: audit.id,
      url: audit.url,
      scannedAt: audit.timestamp,
      status: "completed",
      deepScan: audit.deepScan,
      pagesScanned: audit.pagesScanned?.map((p) => ({
        url: p.url,
        title: p.title,
        violationCount: p.violationCount,
      })),
      summary: {
        totalChecks: allClauses.length,
        passed,
        failed,
        needsReview,
        overallStatus,
      },
      clauses: allClauses,
    };

    return report;
  });

  // Comparison with previous scan
  app.get<{ Params: { id: string } }>("/report/:id/comparison", async (request, reply) => {
    if (!isPersistedStore(store)) {
      return reply.status(404).send({ error: "Comparison requires database" });
    }

    // Get current scan's audit to find the URL
    const audit = await store.getAsync(request.params.id);
    if (!audit || audit.status !== "completed") {
      return reply.status(404).send({ error: "Scan not found or not completed" });
    }

    // Find the previous completed scan for the same URL
    const history = await store.pg.getHistory(audit.url, 2);
    const previousScan = history.find((s) => s.id !== request.params.id);
    if (!previousScan) {
      return { hasPrevious: false, changes: [] };
    }

    // Get the previous scan's audit result and build its clauses
    const prevAudit = await store.pg.get(previousScan.id);
    if (!prevAudit || prevAudit.status !== "completed") {
      return { hasPrevious: false, changes: [] };
    }

    // Build clause status maps for both scans
    function buildClauseMap(a: typeof audit): Map<string, string> {
      const map = new Map<string, string>();
      const clause9Mappings = getAllClause9Mappings();

      // Web clauses
      const clauseViolations = new Map<string, boolean>();
      for (const v of a!.violations) {
        for (const cid of v.en301549Clauses) {
          clauseViolations.set(cid, true);
        }
      }
      for (const clause of Object.values(clause9Mappings)) {
        map.set(clause.id, clauseViolations.has(clause.id) ? "fail" : "pass");
      }

      // Video clauses
      if (a!.streaming) {
        for (const f of a!.streaming.findings) {
          map.set(f.clauseId, f.status);
        }
      }
      return map;
    }

    const currentMap = buildClauseMap(audit);
    const previousMap = buildClauseMap(prevAudit);

    type ChangeType = "regression" | "fixed" | "new_issue" | "unchanged";
    const changes: Array<{
      clauseId: string;
      previousStatus: string | null;
      currentStatus: string;
      change: ChangeType;
    }> = [];

    for (const [clauseId, currentStatus] of currentMap) {
      const prevStatus = previousMap.get(clauseId) ?? null;
      let change: ChangeType = "unchanged";

      if (prevStatus === "pass" && (currentStatus === "fail" || currentStatus === "needs_review")) {
        change = "regression";
      } else if ((prevStatus === "fail" || prevStatus === "needs_review") && currentStatus === "pass") {
        change = "fixed";
      } else if (!prevStatus && currentStatus === "fail") {
        change = "new_issue";
      }

      if (change !== "unchanged") {
        changes.push({ clauseId, previousStatus: prevStatus, currentStatus, change });
      }
    }

    return {
      hasPrevious: true,
      previousScanId: previousScan.id,
      previousScanDate: previousScan.scannedAt,
      changes,
    };
  });
}
