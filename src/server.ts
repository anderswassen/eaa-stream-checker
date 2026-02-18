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
const PORT = parseInt(process.env.PORT ?? "3000", 10);
const GIT_SHA = process.env.GIT_SHA ?? "dev";
const APP_VERSION = "0.0.2";

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
