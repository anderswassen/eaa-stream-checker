import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHistory, getVersion, getRecentDomains } from '../api/client';
import type { DomainHistoryScan, DomainSummary, HistoryResponse } from '../api/client';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

/* ---------- Sparkline ---------- */
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 72, h = 28, pad = 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const points = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (w - pad * 2);
    const y = h - pad - ((s - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const last = scores[scores.length - 1];
  const color = last >= 80 ? '#4ade80' : last >= 50 ? '#facc15' : '#f87171';
  const lastPt = points.split(' ').pop()!.split(',');
  return (
    <svg width={w} height={h} className="inline-block" aria-label={`Score trend: ${scores.join(', ')}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
    </svg>
  );
}

/* ---------- Score Badge ---------- */
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-500">--</span>;
  const color =
    score >= 80
      ? 'text-green-400 bg-green-500/10'
      : score >= 50
        ? 'text-yellow-400 bg-yellow-500/10'
        : 'text-red-400 bg-red-500/10';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

/* ---------- Trend Indicator ---------- */
function TrendIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-slate-500 text-xs">--</span>;
  const positive = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
      <svg className={`h-3 w-3 ${positive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
      </svg>
      {positive ? '+' : ''}{diff}
    </span>
  );
}

/* ---------- Helpers ---------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number | null) {
  if (ms === null) return '--';
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ========== Main Component ========== */
export function HistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);
  const [search, setSearch] = useState(searchParams.get('domain') ?? searchParams.get('url') ?? '');

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const q = query.trim();
      const isUrl = q.includes('://') || q.includes('/');
      const params = isUrl
        ? { url: q.startsWith('http') ? q : `https://${q}` }
        : { domain: q };
      const result = await getHistory({ ...params, limit: 50 });
      setHistory(result);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getVersion()
      .then(async (v) => {
        const hasPg = v.persistence === 'postgresql';
        setDbAvailable(hasPg);

        if (!hasPg) {
          setLoading(false);
          return;
        }

        // Auto-search if query params provided
        const domain = searchParams.get('domain');
        const url = searchParams.get('url');
        if (domain) {
          doSearch(domain);
        } else if (url) {
          doSearch(url);
        } else {
          // Load recent domains overview
          try {
            const data = await getRecentDomains(20);
            setDomains(data.domains);
          } catch {
            // silently ignore — domains dashboard is optional
          }
          setLoading(false);
        }
      })
      .catch(() => {
        setDbAvailable(false);
        setLoading(false);
      });
  }, [searchParams, doSearch]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(search);
  }

  function handleRescan(url: string) {
    navigate(`/?scan=${encodeURIComponent(url)}`);
  }

  function handleDomainClick(domain: string) {
    setSearch(domain);
    doSearch(domain);
  }

  function handleBackToOverview() {
    setHistory(null);
    setSearch('');
    // Reload domains
    getRecentDomains(20).then((data) => setDomains(data.domains)).catch(() => {});
  }

  if (dbAvailable === false) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
            <svg className="h-7 w-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">Scan history requires a database connection.</p>
          <p className="text-slate-500 text-sm">Set up PostgreSQL and configure DATABASE_URL to enable history tracking.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors"
          >
            Back to scan
          </Link>
        </div>
      </main>
    );
  }

  const scans = (history?.scans ?? []) as DomainHistoryScan[];

  return (
    <main id="main-content" className="flex-1 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Scan History
          </h1>
          <p className="text-slate-500">
            Track compliance over time across all scanned domains.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <form onSubmit={handleSearch} className="glass rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by domain or URL..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all shadow-lg shadow-brand-500/20"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {error && (
          <p role="alert" className="text-red-400 text-sm">{error}</p>
        )}

        {/* Domain Overview (default view) */}
        {!history && !loading && dbAvailable && domains.length > 0 && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              All Scanned Domains
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {domains.map((d) => (
                <motion.div
                  key={d.domain}
                  variants={fadeUp}
                  className="glass rounded-2xl p-5 space-y-3 hover:ring-1 hover:ring-brand-500/30 transition-all cursor-pointer group"
                  onClick={() => handleDomainClick(d.domain)}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-brand-400 transition-colors">
                        {d.domain}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{timeAgo(d.lastScanAt)}</p>
                    </div>
                    <ScoreBadge score={d.latestScore} />
                  </div>

                  {/* Sparkline + trend */}
                  <div className="flex items-center justify-between">
                    <Sparkline scores={d.recentScores} />
                    <TrendIndicator current={d.latestScore} previous={d.previousScore} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/30 dark:border-slate-700/30">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {d.scanCount} scan{d.scanCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRescan(d.latestUrl);
                      }}
                      className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Re-scan
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state (no domains at all) */}
        {!history && !loading && dbAvailable && domains.length === 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-12 text-center space-y-3">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400">No scans yet. Run your first scan to start tracking history.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors text-sm"
            >
              Start a scan
            </Link>
          </motion.div>
        )}

        {/* Detail View (search results) */}
        {history && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToOverview}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Back to overview"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {history.domain ? history.domain : history.url}
                </h2>
              </div>
              <span className="text-sm text-slate-500">
                {history.scanCount} scan{history.scanCount !== 1 ? 's' : ''}
              </span>
            </div>

            {scans.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-slate-500">No completed scans found.</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                      {history.domain && (
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">URL</th>
                      )}
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Score</th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Trend</th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Passed</th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Failed</th>
                      <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Review</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Duration</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                    {scans.map((scan, i) => {
                      const prevScan = scans[i + 1]; // scans are newest first
                      return (
                        <tr key={scan.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {formatDate(scan.scannedAt)}
                          </td>
                          {history.domain && (
                            <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">
                              {(scan as DomainHistoryScan).url}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center">
                            <ScoreBadge score={scan.score} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <TrendIndicator
                              current={scan.score}
                              previous={prevScan?.score ?? null}
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-green-400 tabular-nums">{scan.passed}</td>
                          <td className="px-4 py-3 text-center text-red-400 tabular-nums">{scan.failed}</td>
                          <td className="px-4 py-3 text-center text-yellow-400 tabular-nums">{scan.needsReview}</td>
                          <td className="px-4 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                            {formatDuration(scan.durationMs ?? null)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleRescan((scan as DomainHistoryScan).url || history.url || '')}
                                className="text-slate-500 hover:text-brand-400 transition-colors"
                                aria-label="Re-scan"
                                title="Re-scan"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <Link
                                to={`/report/${scan.id}`}
                                className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
