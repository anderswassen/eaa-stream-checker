import { resolve } from "node:path";
import { existsSync } from "node:fs";
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
const APP_VERSION = "0.7.0";
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
  // SPA fallback: serve index.html for any non-API, non-file route
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
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
