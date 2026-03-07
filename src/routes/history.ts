import type { FastifyInstance } from "fastify";
import type { PersistentStore } from "../store/index.js";

export async function historyRoutes(
  app: FastifyInstance,
  store: PersistentStore
) {
  // GET /api/history?url=<url>&limit=20
  app.get<{ Querystring: { url?: string; domain?: string; limit?: string } }>(
    "/history",
    async (request, reply) => {
      const { url, domain, limit: limitStr } = request.query;
      const limit = Math.min(parseInt(limitStr ?? "20", 10) || 20, 100);

      if (!url && !domain) {
        return reply
          .status(400)
          .send({ error: "Either 'url' or 'domain' query parameter is required" });
      }

      if (url) {
        const history = await store.pg.getHistory(url, limit);
        return {
          url,
          scanCount: history.length,
          scans: history,
        };
      }

      const history = await store.pg.getDomainHistory(domain!, limit);
      return {
        domain,
        scanCount: history.length,
        scans: history,
      };
    }
  );
}
