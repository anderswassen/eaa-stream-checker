import pg from "pg";
import type { AuditResult } from "../types/audit.js";
import { runMigrations } from "./migrations.js";
import { computeClauseScore, computeClauseCounts } from "../utils/score.js";

const { Pool } = pg;

export class PgStore {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    // Parse connection string to handle special characters in password
    const url = new URL(connectionString);
    this.pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1) || "postgres",
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: false,
    });
  }

  async init(): Promise<void> {
    await runMigrations(this.pool);
  }

  /** Run a raw query (used by diagnostics). */
  async query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /** Save or update a scan result. */
  async set(id: string, audit: AuditResult): Promise<void> {
    const domain = extractDomain(audit.url);
    const score = computeScore(audit);
    const counts = computeClauseCounts(audit);

    await this.pool.query(
      `INSERT INTO scan_results
        (id, url, domain, scanned_at, status, score, passed, failed, needs_review, total_checks, duration_ms, deep_scan, result_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        score = EXCLUDED.score,
        passed = EXCLUDED.passed,
        failed = EXCLUDED.failed,
        needs_review = EXCLUDED.needs_review,
        total_checks = EXCLUDED.total_checks,
        duration_ms = EXCLUDED.duration_ms,
        result_json = EXCLUDED.result_json`,
      [
        id,
        audit.url,
        domain,
        audit.timestamp,
        audit.status,
        score,
        counts.passed,
        counts.failed,
        counts.needsReview,
        counts.totalChecks,
        audit.duration ?? null,
        audit.deepScan ?? false,
        JSON.stringify(audit),
      ]
    );
  }

  /** Get a single scan result by ID. */
  async get(id: string): Promise<AuditResult | undefined> {
    const { rows } = await this.pool.query(
      `SELECT result_json FROM scan_results WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return undefined;
    return rows[0].result_json as AuditResult;
  }

  /** List all scans (summary only, most recent first). */
  async list(): Promise<
    Array<{
      id: string;
      url: string;
      status: string;
      timestamp: string;
      violationCount: number;
      score: number | null;
    }>
  > {
    const { rows } = await this.pool.query(
      `SELECT id, url, status, scanned_at, score,
              (result_json->'violations') as violations
       FROM scan_results
       ORDER BY scanned_at DESC
       LIMIT 100`
    );
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      status: r.status,
      timestamp: r.scanned_at,
      violationCount: Array.isArray(r.violations) ? r.violations.length : 0,
      score: r.score,
    }));
  }

  /** Get scan history for a URL (B1). */
  async getHistory(
    url: string,
    limit = 20
  ): Promise<
    Array<{
      id: string;
      scannedAt: string;
      score: number | null;
      passed: number;
      failed: number;
      needsReview: number;
      totalChecks: number;
      durationMs: number | null;
    }>
  > {
    const { rows } = await this.pool.query(
      `SELECT id, scanned_at, score, passed, failed, needs_review, total_checks, duration_ms
       FROM scan_results
       WHERE url = $1 AND status = 'completed'
       ORDER BY scanned_at DESC
       LIMIT $2`,
      [url, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      scannedAt: r.scanned_at,
      score: r.score,
      passed: r.passed,
      failed: r.failed,
      needsReview: r.needs_review,
      totalChecks: r.total_checks,
      durationMs: r.duration_ms,
    }));
  }

  /** Get scan history for an entire domain (B1). */
  async getDomainHistory(
    domain: string,
    limit = 50
  ): Promise<
    Array<{
      id: string;
      url: string;
      scannedAt: string;
      score: number | null;
      passed: number;
      failed: number;
      needsReview: number;
      totalChecks: number;
      durationMs: number | null;
    }>
  > {
    const { rows } = await this.pool.query(
      `SELECT id, url, scanned_at, score, passed, failed, needs_review, total_checks, duration_ms
       FROM scan_results
       WHERE domain = $1 AND status = 'completed'
       ORDER BY scanned_at DESC
       LIMIT $2`,
      [domain, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      scannedAt: r.scanned_at,
      score: r.score,
      passed: r.passed,
      failed: r.failed,
      needsReview: r.needs_review,
      totalChecks: r.total_checks,
      durationMs: r.duration_ms,
    }));
  }

  /** Get recently scanned domains with their latest score, scan count, and sparkline data. */
  async getRecentDomains(limit = 10): Promise<
    Array<{
      domain: string;
      latestUrl: string;
      latestScore: number | null;
      previousScore: number | null;
      scanCount: number;
      lastScanAt: string;
      recentScores: number[];
    }>
  > {
    const { rows } = await this.pool.query(
      `WITH ranked AS (
         SELECT domain, url, score, scanned_at,
                ROW_NUMBER() OVER (PARTITION BY domain ORDER BY scanned_at DESC) as rn,
                COUNT(*) OVER (PARTITION BY domain) as scan_count,
                LAG(score) OVER (PARTITION BY domain ORDER BY scanned_at) as prev_score
         FROM scan_results
         WHERE status = 'completed' AND score IS NOT NULL
       )
       SELECT r.domain, r.url as latest_url, r.score as latest_score, r.prev_score as previous_score,
              r.scan_count, r.scanned_at as last_scan_at,
              (SELECT array_agg(sub.score ORDER BY sub.scanned_at ASC)
               FROM (SELECT score, scanned_at FROM scan_results
                     WHERE domain = r.domain AND status = 'completed' AND score IS NOT NULL
                     ORDER BY scanned_at DESC LIMIT 10) sub
              ) as recent_scores
       FROM ranked r
       WHERE r.rn = 1
       ORDER BY r.scanned_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      domain: r.domain,
      latestUrl: r.latest_url,
      latestScore: r.latest_score,
      previousScore: r.previous_score,
      scanCount: parseInt(r.scan_count, 10),
      lastScanAt: r.last_scan_at,
      recentScores: r.recent_scores ?? [],
    }));
  }

  /** Get compliance score summary for a URL (B2). */
  async getScoreSummary(url: string): Promise<{
    url: string;
    domain: string;
    latestScore: number | null;
    previousScore: number | null;
    trend: "improving" | "declining" | "stable" | "insufficient_data";
    scanCount: number;
    firstScanAt: string | null;
    lastScanAt: string | null;
    averageScore: number | null;
    bestScore: number | null;
    worstScore: number | null;
  }> {
    const domain = extractDomain(url);
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*) as scan_count,
         MIN(scanned_at) as first_scan,
         MAX(scanned_at) as last_scan,
         ROUND(AVG(score)) as avg_score,
         MAX(score) as best_score,
         MIN(score) as worst_score
       FROM scan_results
       WHERE url = $1 AND status = 'completed' AND score IS NOT NULL`,
      [url]
    );

    const stats = rows[0];
    const scanCount = parseInt(stats.scan_count, 10);

    // Get latest two scores for trend
    const { rows: recent } = await this.pool.query(
      `SELECT score FROM scan_results
       WHERE url = $1 AND status = 'completed' AND score IS NOT NULL
       ORDER BY scanned_at DESC LIMIT 2`,
      [url]
    );

    const latestScore = recent[0]?.score ?? null;
    const previousScore = recent[1]?.score ?? null;

    let trend: "improving" | "declining" | "stable" | "insufficient_data";
    if (scanCount < 2) {
      trend = "insufficient_data";
    } else if (latestScore === previousScore) {
      trend = "stable";
    } else if (latestScore !== null && previousScore !== null && latestScore > previousScore) {
      trend = "improving";
    } else {
      trend = "declining";
    }

    return {
      url,
      domain,
      latestScore,
      previousScore,
      trend,
      scanCount,
      firstScanAt: stats.first_scan,
      lastScanAt: stats.last_scan,
      averageScore: stats.avg_score !== null ? Number(stats.avg_score) : null,
      bestScore: stats.best_score,
      worstScore: stats.worst_score,
    };
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function computeScore(audit: AuditResult): number | null {
  return computeClauseScore(audit);
}
