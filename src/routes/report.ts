import type { FastifyInstance } from "fastify";
import type { AuditStore, ScanReport, AuditViolation } from "../types/audit.js";
import { getAllClause9Mappings } from "../mappings/en301549.js";

export async function reportRoutes(app: FastifyInstance, store: AuditStore) {
  // GET /report/:id — structured EN 301 549 report
  app.get<{ Params: { id: string } }>("/report/:id", async (request, reply) => {
    const audit = store.get(request.params.id);
    if (!audit) {
      return reply.status(404).send({ error: "Scan not found" });
    }

    if (audit.status !== "completed") {
      return reply.status(409).send({
        error: "Scan not yet completed",
        status: audit.status,
      });
    }

    const mappings = getAllClause9Mappings();

    // Build per-clause summary
    const clauseViolations = new Map<string, AuditViolation[]>();
    for (const v of audit.violations) {
      for (const clauseId of v.en301549Clauses) {
        const list = clauseViolations.get(clauseId) ?? [];
        list.push(v);
        clauseViolations.set(clauseId, list);
      }
    }

    const en301549Summary = Object.values(mappings).map((clause) => {
      const violations = clauseViolations.get(clause.id) ?? [];
      let status: "pass" | "fail" | "needs-review" | "not-applicable";
      if (violations.length > 0) {
        status = "fail";
      } else {
        // If no violations found for this clause, mark as pass
        // (only covers automated checks — manual review may still be needed)
        status = "pass";
      }

      return {
        clause: clause.id,
        title: clause.title,
        status,
        violations,
      };
    });

    const report: ScanReport = {
      audit,
      en301549Summary,
    };

    return report;
  });
}
