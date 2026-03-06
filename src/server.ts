import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import type { AuditStore } from "./types/audit.js";
import { healthRoutes } from "./routes/health.js";
import { scanRoutes } from "./routes/scan.js";
import { reportRoutes } from "./routes/report.js";
import { mappingRoutes } from "./routes/mappings.js";
import { closeBrowser } from "./services/crawler.js";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = parseInt(process.env.PORT ?? "8080", 10);
const GIT_SHA = process.env.GIT_SHA ?? "dev";
const APP_VERSION = "0.0.10";

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

// In-memory audit store (will be replaced with PostgreSQL later)
const store: AuditStore = new Map();

// Version endpoint
app.get("/version", async () => ({
  version: APP_VERSION,
  sha: GIT_SHA,
}));

// Diagnostic endpoint
app.get("/debug/chromium", async () => {
  const { existsSync, readdirSync, statSync } = await import("node:fs");
  const { execSync } = await import("node:child_process");
  const sparticuzChromium = (await import("@sparticuz/chromium")).default;
  const execPath = await sparticuzChromium.executablePath();
  const tmpFiles = readdirSync("/tmp").filter(f => f.includes("chrom") || f.includes("playwright") || f === "chromium");

  let fileInfo = "";
  let lddInfo = "";
  let permissions = "";
  let launchTest = "";
  try { fileInfo = execSync(`file ${execPath}`).toString().trim(); } catch (e: any) { fileInfo = e.message; }
  try { lddInfo = execSync(`ldd ${execPath} 2>&1`).toString().trim(); } catch (e: any) { lddInfo = e.message; }
  try { const s = statSync(execPath); permissions = `mode=${s.mode.toString(8)}, size=${s.size}`; } catch (e: any) { permissions = e.message; }
  try { launchTest = execSync(`${execPath} --version 2>&1`, { timeout: 5000 }).toString().trim(); } catch (e: any) { launchTest = e.stderr?.toString() || e.message; }

  return {
    executablePath: execPath,
    exists: existsSync(execPath),
    permissions,
    fileInfo,
    lddInfo: lddInfo.slice(0, 2000),
    launchTest,
    tmpFiles,
    arch: process.arch,
    platform: process.platform,
  };
});

// Register routes under /api prefix so frontend can proxy cleanly
await app.register(healthRoutes);
await app.register(
  async (instance) => {
    await scanRoutes(instance, store);
    await reportRoutes(instance, store);
    await instance.register(mappingRoutes);
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
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Start
try {
  await app.listen({ host: HOST, port: PORT });
  app.log.info(`EAA Stream Checker v${APP_VERSION} (${GIT_SHA}) running at http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
