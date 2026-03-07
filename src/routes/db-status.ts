import type { FastifyInstance } from "fastify";
import type { PersistentStore } from "../store/index.js";

export async function dbStatusRoutes(
  app: FastifyInstance,
  store: PersistentStore
) {
  // GET /api/db-status — diagnostic endpoint for PostgreSQL connectivity
  app.get("/db-status", async () => {
    const checks: Record<string, unknown> = {
      persistence: "postgresql",
      connected: false,
      tableExists: false,
      scanCount: null,
      latestScan: null,
      error: null,
    };

    try {
      // Test basic connectivity
      const connectResult = await store.pg.query("SELECT NOW() as server_time");
      checks.connected = true;
      checks.serverTime = connectResult.rows[0].server_time;

      // Check if table exists
      const tableCheck = await store.pg.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'scan_results'
        ) as exists`
      );
      checks.tableExists = tableCheck.rows[0].exists;

      if (checks.tableExists) {
        // Count rows
        const countResult = await store.pg.query(
          "SELECT COUNT(*) as count FROM scan_results"
        );
        checks.scanCount = parseInt(countResult.rows[0].count, 10);

        // Get latest scan
        const latestResult = await store.pg.query(
          `SELECT id, url, status, score, scanned_at
           FROM scan_results
           ORDER BY scanned_at DESC
           LIMIT 1`
        );
        checks.latestScan = latestResult.rows[0] ?? null;
      }
    } catch (err) {
      checks.error = err instanceof Error ? err.message : String(err);
    }

    return checks;
  });
}
