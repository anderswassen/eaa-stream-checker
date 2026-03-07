import type { Pool } from "pg";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS scan_results (
  id            UUID PRIMARY KEY,
  url           TEXT NOT NULL,
  domain        TEXT NOT NULL,
  scanned_at    TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL,
  score         INTEGER,
  passed        INTEGER NOT NULL DEFAULT 0,
  failed        INTEGER NOT NULL DEFAULT 0,
  needs_review  INTEGER NOT NULL DEFAULT 0,
  total_checks  INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  deep_scan     BOOLEAN NOT NULL DEFAULT FALSE,
  result_json   JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_url ON scan_results (url, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_domain ON scan_results (domain, scanned_at DESC);
`;

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(SCHEMA_SQL);
}
