import Fastify from "fastify";
import type { AuditStore } from "./types/audit.js";
import { healthRoutes } from "./routes/health.js";
import { scanRoutes } from "./routes/scan.js";
import { reportRoutes } from "./routes/report.js";
import { mappingRoutes } from "./routes/mappings.js";
import { closeBrowser } from "./services/crawler.js";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = parseInt(process.env.PORT ?? "3000", 10);

const app = Fastify({
  logger: {
    level: "info",
    ...(process.env.NODE_ENV !== "production" && {
      transport: { target: "pino-pretty" },
    }),
  },
});

// In-memory audit store (will be replaced with PostgreSQL later)
const store: AuditStore = new Map();

// Register routes
await app.register(healthRoutes);
await app.register(async (instance) => scanRoutes(instance, store));
await app.register(async (instance) => reportRoutes(instance, store));
await app.register(mappingRoutes);

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
  app.log.info(`EAA Stream Checker API running at http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
