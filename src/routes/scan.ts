import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import type { AuditRequest, AuditResult, AuditStore, PageResult, AuditViolation } from "../types/audit.js";
import { crawlPage, extractInternalLinks } from "../services/crawler.js";
import { analyzePage } from "../services/analyzer.js";
import { prepareStreamingAnalysis } from "../services/streaming/index.js";
import { createScanEmitter, getScanEmitter, emitScanProgress } from "../scan-events.js";
import { computeClauseScore } from "../utils/score.js";

export async function scanRoutes(app: FastifyInstance, store: AuditStore) {
  // POST /scan — start an async scan
  app.post<{ Body: AuditRequest }>("/scan", async (request, reply) => {
    const { url, tags, waitForSelector, timeout, deepScan, maxPages } = request.body;

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
      deepScan: deepScan ?? false,
    };

    store.set(id, audit);
    createScanEmitter(id);
    reply.status(202).send({ id, status: "pending", url });

    // Run the scan asynchronously
    runScan(store, id, url, { tags, waitForSelector, timeout, deepScan, maxPages });
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

  // GET /scan/:id/stream — SSE endpoint for real-time scan progress
  app.get<{ Params: { id: string } }>("/scan/:id/stream", async (request, reply) => {
    const emitter = getScanEmitter(request.params.id);

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });

    if (!emitter) {
      // Scan already completed or not found — send complete immediately
      const audit = store.get(request.params.id);
      if (audit && audit.status === "completed") {
        const total = audit.violations.length + audit.passes + audit.incomplete + audit.inapplicable;
        const score = total > 0 ? Math.round(((total - audit.violations.length) / total) * 100) : 0;
        reply.raw.write(`data: ${JSON.stringify({ type: "complete", id: audit.id, score })}\n\n`);
      } else if (audit && audit.status === "failed") {
        reply.raw.write(`data: ${JSON.stringify({ type: "error", message: audit.error ?? "Scan failed" })}\n\n`);
      }
      reply.raw.end();
      return;
    }

    const handler = (data: unknown) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        // Client disconnected
      }
    };

    emitter.on("progress", handler);

    // Keepalive every 15s
    const keepalive = setInterval(() => {
      try {
        reply.raw.write(": keepalive\n\n");
      } catch {
        clearInterval(keepalive);
      }
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(keepalive);
      emitter.off("progress", handler);
    });
  });
}

async function runScan(
  store: AuditStore,
  id: string,
  url: string,
  options: {
    tags?: string[];
    waitForSelector?: string;
    timeout?: number;
    deepScan?: boolean;
    maxPages?: number;
  }
) {
  const audit = store.get(id)!;
  audit.status = "running";
  const start = Date.now();

  emitScanProgress(id, { type: "phase", phase: "connecting", message: "Loading page in browser" });

  let context;
  try {
    const crawl = await crawlPage(url, {
      waitForSelector: options.waitForSelector,
      timeout: options.timeout,
    });
    context = crawl.context;

    emitScanProgress(id, { type: "phase", phase: "analyzing", message: "Running accessibility checks" });

    // Run axe-core web accessibility audit on the primary page
    const analysis = await analyzePage(crawl.page, options.tags, {
      captureScreenshots: true,
      pageUrl: url,
    });

    audit.violations = analysis.violations;
    audit.passes = analysis.passes;
    audit.incomplete = analysis.incomplete;
    audit.inapplicable = analysis.inapplicable;

    emitScanProgress(id, {
      type: "web_complete",
      passed: analysis.passes,
      failed: analysis.violations.length,
      incomplete: analysis.incomplete,
    });

    const pageResults: PageResult[] = [
      {
        url,
        title: crawl.title,
        violationCount: analysis.violations.length,
        duration: Date.now() - start,
      },
    ];

    // Run streaming-specific analysis — only reload if page likely has a video player
    try {
      const hasVideo = await crawl.page.evaluate(() => {
        return document.querySelectorAll('video, audio, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="player"], [class*="player"], [id*="player"]').length > 0;
      });

      if (hasVideo) {
        emitScanProgress(id, { type: "phase", phase: "streaming", message: "Analyzing video player" });
        const streaming = prepareStreamingAnalysis(crawl.page);
        await streaming.setupInterception();
        await crawl.page.reload({ waitUntil: "domcontentloaded" });
        await crawl.page.waitForTimeout(3000);
        audit.streaming = await streaming.analyze();

        emitScanProgress(id, {
          type: "streaming_complete",
          playerType: audit.streaming.playerType,
          hasCaptions: audit.streaming.captions?.hasCaptions ?? false,
          hasAudioDescription: audit.streaming.audioDescription?.hasAudioDescription ?? false,
        });
      } else {
        // No video — emit streaming complete with null
        emitScanProgress(id, {
          type: "streaming_complete",
          playerType: null,
          hasCaptions: false,
          hasAudioDescription: false,
        });
      }
    } catch (streamingErr) {
      console.warn("Streaming analysis failed:", streamingErr);
      emitScanProgress(id, {
        type: "streaming_complete",
        playerType: null,
        hasCaptions: false,
        hasAudioDescription: false,
      });
    }

    // Deep scan: crawl additional internal pages
    if (options.deepScan) {
      emitScanProgress(id, { type: "phase", phase: "crawling", message: "Scanning additional pages" });
      const maxPages = Math.min(options.maxPages ?? 5, 10);
      const internalLinks = await extractInternalLinks(crawl.page, url, maxPages * 2);
      // Filter out the seed URL and take up to maxPages - 1 additional pages
      const additionalUrls = internalLinks
        .filter((link) => link !== url && new URL(link).pathname !== new URL(url).pathname)
        .slice(0, maxPages - 1);

      for (const pageUrl of additionalUrls) {
        const pageStart = Date.now();
        let pageContext;
        try {
          const pageCrawl = await crawlPage(pageUrl, { timeout: options.timeout });
          pageContext = pageCrawl.context;
          const pageAnalysis = await analyzePage(pageCrawl.page, options.tags, {
            captureScreenshots: true,
            pageUrl,
          });

          // Merge violations: add new ones, skip duplicates by id+target
          const existingKeys = new Set(
            audit.violations.flatMap((v) =>
              v.nodes.map((n) => `${v.id}::${n.target.join(",")}`)
            )
          );
          for (const violation of pageAnalysis.violations) {
            const newNodes = violation.nodes.filter(
              (n) => !existingKeys.has(`${violation.id}::${n.target.join(",")}`)
            );
            if (newNodes.length > 0) {
              const existing = audit.violations.find((v) => v.id === violation.id);
              if (existing) {
                existing.nodes.push(...newNodes);
              } else {
                audit.violations.push({ ...violation, nodes: newNodes });
              }
            }
          }
          audit.passes += pageAnalysis.passes;
          audit.incomplete += pageAnalysis.incomplete;
          audit.inapplicable += pageAnalysis.inapplicable;

          pageResults.push({
            url: pageUrl,
            title: pageCrawl.title,
            violationCount: pageAnalysis.violations.length,
            duration: Date.now() - pageStart,
          });
          emitScanProgress(id, {
            type: "page_scanned",
            pageUrl,
            pageTitle: pageCrawl.title,
            pageViolations: pageAnalysis.violations.length,
            pageCurrent: pageResults.length,
            pageTotal: additionalUrls.length + 1,
          });
        } catch (pageErr) {
          console.warn(`Deep scan page failed (${pageUrl}):`, pageErr);
          pageResults.push({
            url: pageUrl,
            title: `Could not access — ${pageErr instanceof Error ? pageErr.message.slice(0, 80) : "unknown error"}`,
            violationCount: 0,
            duration: Date.now() - pageStart,
          });
        } finally {
          if (pageContext) await pageContext.close();
        }
      }

      audit.pagesScanned = pageResults;
    }

    emitScanProgress(id, { type: "phase", phase: "mapping", message: "Building compliance report" });

    audit.status = "completed";
    audit.duration = Date.now() - start;

    // Compute score for SSE (clause-based, same as report page)
    const scanScore = computeClauseScore(audit) ?? 0;
    emitScanProgress(id, { type: "complete", id, score: scanScore });
  } catch (err) {
    audit.status = "failed";
    audit.error = err instanceof Error ? err.message : String(err);
    audit.duration = Date.now() - start;
    emitScanProgress(id, { type: "error", message: audit.error });
  } finally {
    if (context) {
      await context.close();
    }
    // Persist final state (completed/failed) to database
    store.set(id, audit);
  }
}
