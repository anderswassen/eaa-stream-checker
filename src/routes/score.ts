import type { FastifyInstance } from "fastify";
import type { PersistentStore } from "../store/index.js";

export async function scoreRoutes(
  app: FastifyInstance,
  store: PersistentStore
) {
  // GET /api/score?url=<url>
  app.get<{ Querystring: { url?: string } }>(
    "/score",
    async (request, reply) => {
      const { url } = request.query;

      if (!url) {
        return reply.status(400).send({ error: "'url' query parameter is required" });
      }

      return store.pg.getScoreSummary(url);
    }
  );
}
