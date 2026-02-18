import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import type { AuditRequest, AuditResult, AuditStore } from "../types/audit.js";
import { crawlPage } from "../services/crawler.js";
import { analyzePage } from "../services/analyzer.js";
import { prepareStreamingAnalysis } from "../services/streaming/index.js";
import type { StreamingAnalysisResult } from "../services/streaming/index.js";

export async function scanRoutes(app: FastifyInstance, store: AuditStore) {
  // POST /scan — start an async scan
  app.post<{ Body: AuditRequest }>("/scan", async (request, reply) => {
    const { url, tags, waitForSelector, timeout } = request.body;

    if (!url) {
      return reply.status(400).send({ error: "url is required" });
    }

    const id = uuidv4();
    const audit: AuditResult = {
      id,
      url,
      timestamp: new Date().toISOString(),
      status: "pending",
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
    };

    store.set(id, audit);
    reply.status(202).send({ id, status: "pending", url });

    // Run the scan asynchronously
    runScan(store, id, url, { tags, waitForSelector, timeout });
  });

  // POST /scan/sync — run a scan synchronously and return the result
  app.post<{ Body: AuditRequest }>("/scan/sync", async (request, reply) => {
    const { url, tags, waitForSelector, timeout } = request.body;

    if (!url) {
      return reply.status(400).send({ error: "url is required" });
    }

    const id = uuidv4();
    const audit: AuditResult = {
      id,
      url,
      timestamp: new Date().toISOString(),
      status: "pending",
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
    };

    store.set(id, audit);

    await runScan(store, id, url, { tags, waitForSelector, timeout });
    return store.get(id);
  });

  // GET /scan/:id — get scan status and results
  app.get<{ Params: { id: string } }>("/scan/:id", async (request, reply) => {
    const audit = store.get(request.params.id);
    if (!audit) {
      return reply.status(404).send({ error: "Scan not found" });
    }
    // Map backend status to frontend-expected status
    const statusMap: Record<string, string> = {
      pending: "in_progress",
      running: "in_progress",
      completed: "completed",
      failed: "failed",
    };
    return { ...audit, status: statusMap[audit.status] ?? audit.status };
  });

  // GET /scans — list all scans
  app.get("/scans", async () => {
    return Array.from(store.values()).map((a) => ({
      id: a.id,
      url: a.url,
      status: a.status,
      timestamp: a.timestamp,
      violationCount: a.violations.length,
    }));
  });
}

async function runScan(
  store: AuditStore,
  id: string,
  url: string,
  options: { tags?: string[]; waitForSelector?: string; timeout?: number }
) {
  const audit = store.get(id)!;
  audit.status = "running";
  const start = Date.now();

  let context;
  try {
    const crawl = await crawlPage(url, {
      waitForSelector: options.waitForSelector,
      timeout: options.timeout,
    });
    context = crawl.context;

    // Run axe-core web accessibility audit
    const analysis = await analyzePage(crawl.page, options.tags);

    audit.violations = analysis.violations;
    audit.passes = analysis.passes;
    audit.incomplete = analysis.incomplete;
    audit.inapplicable = analysis.inapplicable;

    // Run streaming-specific analysis (player detection, captions, AD, Clause 7)
    try {
      const streaming = prepareStreamingAnalysis(crawl.page);
      await streaming.setupInterception();
      await crawl.page.reload({ waitUntil: "networkidle" });
      audit.streaming = await streaming.analyze();
    } catch (streamingErr) {
      // Streaming analysis is non-fatal — log and continue
      console.warn("Streaming analysis failed:", streamingErr);
    }

    audit.status = "completed";
    audit.duration = Date.now() - start;
  } catch (err) {
    audit.status = "failed";
    audit.error = err instanceof Error ? err.message : String(err);
    audit.duration = Date.now() - start;
  } finally {
    if (context) {
      await context.close();
    }
  }
}
