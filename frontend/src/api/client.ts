import type { ScanReport } from '../types/report';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export interface StartScanOptions {
  url: string;
  deepScan?: boolean;
  maxPages?: number;
}

export async function startScan(options: StartScanOptions): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error(`Scan request failed: ${res.statusText}`);
  return res.json();
}

export async function getScanStatus(
  id: string,
): Promise<{ status: ScanReport['status']; error?: string }> {
  const res = await fetch(`${API_BASE}/api/scan/${id}`);
  if (!res.ok) throw new Error(`Status check failed (HTTP ${res.status})`);
  return res.json();
}

export async function getReport(id: string): Promise<ScanReport> {
  const res = await fetch(`${API_BASE}/api/report/${id}`);
  if (!res.ok) throw new Error(`Report fetch failed: ${res.statusText}`);
  return res.json();
}

// --- History & Score APIs (requires PostgreSQL) ---

export interface HistoryScan {
  id: string;
  scannedAt: string;
  score: number | null;
  passed: number;
  failed: number;
  needsReview: number;
  totalChecks: number;
  durationMs: number | null;
}

export interface DomainHistoryScan extends HistoryScan {
  url: string;
}

export interface HistoryResponse {
  url?: string;
  domain?: string;
  scanCount: number;
  scans: HistoryScan[] | DomainHistoryScan[];
}

export interface ScoreResponse {
  url: string;
  domain: string;
  latestScore: number | null;
  previousScore: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  scanCount: number;
  firstScanAt: string | null;
  lastScanAt: string | null;
  averageScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
}

export interface VersionResponse {
  version: string;
  sha: string;
  persistence: 'postgresql' | 'memory';
  databaseConfigured: boolean;
}

export async function getVersion(): Promise<VersionResponse> {
  const res = await fetch(`${API_BASE}/version`);
  if (!res.ok) throw new Error('Version check failed');
  return res.json();
}

export async function getHistory(params: { url?: string; domain?: string; limit?: number }): Promise<HistoryResponse> {
  const qs = new URLSearchParams();
  if (params.url) qs.set('url', params.url);
  if (params.domain) qs.set('domain', params.domain);
  if (params.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`${API_BASE}/api/history?${qs}`);
  if (!res.ok) throw new Error('History fetch failed');
  return res.json();
}

export async function getScore(url: string): Promise<ScoreResponse> {
  const res = await fetch(`${API_BASE}/api/score?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Score fetch failed');
  return res.json();
}

// --- Domain Dashboard API ---

export interface DomainSummary {
  domain: string;
  latestUrl: string;
  latestScore: number | null;
  previousScore: number | null;
  scanCount: number;
  lastScanAt: string;
  recentScores: number[];
}

export async function getRecentDomains(limit = 20): Promise<{ domains: DomainSummary[] }> {
  const res = await fetch(`${API_BASE}/api/domains?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch domains');
  return res.json();
}

// --- Comparison API ---

export interface ClauseChange {
  clauseId: string;
  previousStatus: string | null;
  currentStatus: string;
  change: 'regression' | 'fixed' | 'new_issue';
}

export interface ComparisonResponse {
  hasPrevious: boolean;
  previousScanId?: string;
  previousScanDate?: string;
  changes: ClauseChange[];
}

export async function getComparison(id: string): Promise<ComparisonResponse> {
  const res = await fetch(`${API_BASE}/api/report/${id}/comparison`);
  if (!res.ok) throw new Error('Comparison fetch failed');
  return res.json();
}
