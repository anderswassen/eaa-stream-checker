import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import type { AuditStore } from "./types/audit.js";
import { PersistentStore, isPersistedStore } from "./store/index.js";
import { healthRoutes } from "./routes/health.js";
import { scanRoutes } from "./routes/scan.js";
import { reportRoutes } from "./routes/report.js";
import { mappingRoutes } from "./routes/mappings.js";
import { historyRoutes } from "./routes/history.js";
import { scoreRoutes } from "./routes/score.js";
import { dbStatusRoutes } from "./routes/db-status.js";
import { closeBrowser } from "./services/crawler.js";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = parseInt(process.env.PORT ?? "8080", 10);
const GIT_SHA = process.env.GIT_SHA ?? "dev";
const APP_VERSION = "0.9.2";
const DATABASE_URL = process.env.DATABASE_URL;

const app = Fastify({
  logger: {
    level: "info",
    ...(process.env.NODE_ENV !== "production" && {
      transport: { target: "pino-pretty" },
    }),
  },
});

// CORS for frontend dev server
await app.register(cors, { origin: true });

// Store: PostgreSQL if DATABASE_URL is set, otherwise in-memory
let store: AuditStore | PersistentStore;

if (DATABASE_URL) {
  // Mask password in log output
  const safeUrl = DATABASE_URL.replace(/:([^@]+)@/, ":***@");
  app.log.info(`DATABASE_URL detected: ${safeUrl}`);
  const pgStore = new PersistentStore(DATABASE_URL);
  try {
    await pgStore.init();
    store = pgStore;
    app.log.info("Connected to PostgreSQL — scan history enabled");
  } catch (err) {
    app.log.error({ err }, "Failed to connect to PostgreSQL, falling back to in-memory store");
    store = new Map();
  }
} else {
  store = new Map();
  app.log.info("No DATABASE_URL set — using in-memory store (scan history disabled)");
}

// Version endpoint
app.get("/version", async () => ({
  version: APP_VERSION,
  sha: GIT_SHA,
  persistence: isPersistedStore(store) ? "postgresql" : "memory",
  databaseConfigured: !!DATABASE_URL,
}));

// Register routes under /api prefix so frontend can proxy cleanly
await app.register(healthRoutes);
await app.register(
  async (instance) => {
    await scanRoutes(instance, store);
    await reportRoutes(instance, store);
    await instance.register(mappingRoutes);

    // History, score & diagnostics only available with PostgreSQL
    if (isPersistedStore(store)) {
      await historyRoutes(instance, store);
      await scoreRoutes(instance, store);
      await dbStatusRoutes(instance, store);
    }
  },
  { prefix: "/api" }
);

// Serve frontend static files in production (single-container deployment)
const frontendDist = resolve(process.cwd(), "public");
if (existsSync(frontendDist)) {
  await app.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });
  // Server-side meta tag injection for SEO
  const indexPath = resolve(frontendDist, "index.html");
  const indexHtml = readFileSync(indexPath, "utf-8");

  interface RouteMeta {
    title: string;
    description: string;
    canonical: string;
  }

  const routeMeta: Record<string, RouteMeta> = {
    "/": {
      title: "EAA Compliance Checker — European Accessibility Act & EN 301 549 Scanner",
      description: "Free EAA compliance checker for streaming services. Test your site against the European Accessibility Act (Directive 2019/882) and EN 301 549 in 30 seconds. Automated WCAG 2.1 & 2.2 AA audit, caption checks, audio description, player accessibility — full compliance report with PDF, VPAT, and accessibility statement export.",
      canonical: "https://www.eaachecker.net/",
    },
    "/guides": {
      title: "EAA Compliance Guides for Streaming Services | EAA Checker",
      description: "In-depth guides on European Accessibility Act compliance for streaming platforms. Learn about EN 301 549 requirements, HLS accessibility, caption compliance, audio description, and EAA fines.",
      canonical: "https://www.eaachecker.net/guides",
    },
    "/guide/eaa-streaming-compliance": {
      title: "EAA Compliance for Streaming Services — Complete 2026 Guide | EAA Checker",
      description: "Complete guide to European Accessibility Act compliance for streaming platforms. Learn what the EAA requires for video services, EN 301 549 Clause 7 obligations, enforcement timelines, and how to audit your streaming platform.",
      canonical: "https://www.eaachecker.net/guide/eaa-streaming-compliance",
    },
    "/guide/en-301-549-streaming": {
      title: "EN 301 549 Streaming Requirements — Clause 7 & 9 Explained | EAA Checker",
      description: "Technical deep-dive into EN 301 549 requirements for streaming services. Clause 7 video accessibility, Clause 9 web content, HLS/DASH manifest requirements, and automated compliance testing.",
      canonical: "https://www.eaachecker.net/guide/en-301-549-streaming",
    },
    "/guide/hls-accessibility": {
      title: "HLS Accessibility Compliance — Captions, Audio Description & EN 301 549 | EAA Checker",
      description: "How to make HLS streams accessible and EAA compliant. Configure subtitle tracks, audio description, manifest signalling, and adaptive bitrate accessibility for EN 301 549 compliance.",
      canonical: "https://www.eaachecker.net/guide/hls-accessibility",
    },
    "/guide/eaa-fines": {
      title: "EAA Fines & Penalties by Country — European Accessibility Act Enforcement 2026 | EAA Checker",
      description: "European Accessibility Act fines and penalties by EU member state. Learn what non-compliance costs for streaming services, enforcement timelines, and how to avoid penalties with compliance auditing.",
      canonical: "https://www.eaachecker.net/guide/eaa-fines",
    },
    "/guide/subtitles-captions-eaa": {
      title: "EAA Subtitle & Caption Requirements — EN 301 549 Compliance Guide | EAA Checker",
      description: "Complete guide to subtitle and caption requirements under the European Accessibility Act. EN 301 549 Clause 7.1 obligations, WebVTT/TTML standards, synchronisation, customisation, and automated testing.",
      canonical: "https://www.eaachecker.net/guide/subtitles-captions-eaa",
    },
    "/guide/audio-description-eaa": {
      title: "Audio Description Requirements — EAA & EN 301 549 Compliance Guide | EAA Checker",
      description: "Guide to audio description requirements under the European Accessibility Act. EN 301 549 Clause 7.2 obligations, HLS/DASH implementation, testing tools, and compliance verification for streaming services.",
      canonical: "https://www.eaachecker.net/guide/audio-description-eaa",
    },
    "/help": {
      title: "Help & EN 301 549 Regulatory Context | EAA Checker",
      description: "How EAA Stream Checker works, what EN 301 549 requires for streaming services, Clause 7 video checks, WCAG 2.1 & 2.2 AA audit details, and key European Accessibility Act regulatory dates.",
      canonical: "https://www.eaachecker.net/help",
    },
    "/privacy": {
      title: "Privacy & Data Policy | EAA Checker",
      description: "EAA Stream Checker privacy policy. Learn how we handle your data, what we store, and how scans work. No cookies, no tracking, no third-party data sharing.",
      canonical: "https://www.eaachecker.net/privacy",
    },
    "/accessibility": {
      title: "Accessibility Statement | EAA Checker",
      description: "EAA Checker accessibility statement. Learn about the accessibility features, known limitations, and how to report issues with this tool.",
      canonical: "https://www.eaachecker.net/accessibility",
    },
  };

  function injectMeta(html: string, meta: RouteMeta): string {
    return html
      .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`)
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${meta.canonical}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${meta.title}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${meta.description}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${meta.canonical}"`);
  }

  // SPA fallback with per-route meta injection
  app.setNotFoundHandler((req, reply) => {
    const path = req.url.split("?")[0];
    const meta = routeMeta[path];
    if (meta) {
      reply.type("text/html").send(injectMeta(indexHtml, meta));
    } else {
      reply.type("text/html").send(indexHtml);
    }
  });
  app.log.info(`Serving frontend from ${frontendDist}`);
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down...`);
  await closeBrowser();
  if (isPersistedStore(store)) {
    await store.close();
  }
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Log Chromium availability at startup
const chromiumCandidates = ["/usr/bin/chromium-browser", "/usr/bin/chromium"];
const foundChromium = chromiumCandidates.find((p) => existsSync(p));
if (foundChromium) {
  app.log.info(`System Chromium found at ${foundChromium}`);
} else {
  app.log.warn("No system Chromium found — scans will fail unless CHROMIUM_PATH is set or Playwright has a bundled browser");
}

// Start
try {
  await app.listen({ host: HOST, port: PORT });
  app.log.info(`EAA Stream Checker v${APP_VERSION} (${GIT_SHA}) running at http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
