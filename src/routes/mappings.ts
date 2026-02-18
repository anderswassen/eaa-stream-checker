import type { FastifyInstance } from "fastify";
import { getAllClause9Mappings, mapWcagToEN301549 } from "../mappings/en301549.js";

export async function mappingRoutes(app: FastifyInstance) {
  // GET /mappings/en301549 — all Clause 9 mappings
  app.get("/mappings/en301549", async () => {
    return getAllClause9Mappings();
  });

  // GET /mappings/en301549/:wcag — lookup a specific WCAG criterion
  app.get<{ Params: { wcag: string } }>(
    "/mappings/en301549/:wcag",
    async (request, reply) => {
      const clause = mapWcagToEN301549(request.params.wcag);
      if (!clause) {
        return reply.status(404).send({ error: "No mapping found for WCAG criterion" });
      }
      return clause;
    }
  );
}
