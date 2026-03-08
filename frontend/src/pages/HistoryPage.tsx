import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHistory, getVersion } from '../api/client';
import type { DomainHistoryScan, HistoryResponse } from '../api/client';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'domain' | 'url'>('domain');

  useEffect(() => {
    getVersion()
      .then((v) => {
        setDbAvailable(v.persistence === 'postgresql');
        setLoading(false);
      })
      .catch(() => {
        setDbAvailable(false);
        setLoading(false);
      });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params = searchType === 'domain'
        ? { domain: search.trim() }
        : { url: search.trim().startsWith('http') ? search.trim() : `https://${search.trim()}` };
      const result = await getHistory({ ...params, limit: 50 });
      setHistory(result);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
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
            Track compliance over time. Search by domain or URL.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <form onSubmit={handleSearch} className="glass rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSearchType('domain')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    searchType === 'domain'
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Domain
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('url')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    searchType === 'url'
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  URL
                </button>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchType === 'domain' ? 'expressen.se' : 'https://expressen.se'}
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

        {/* Results */}
        {history && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {history.domain ? `Domain: ${history.domain}` : `URL: ${history.url}`}
              </h2>
              <span className="text-sm text-slate-500">
                {history.scanCount} scan{history.scanCount !== 1 ? 's' : ''}
              </span>
            </div>

            {scans.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-slate-500">No completed scans found.</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
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
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/report/${scan.id}`}
                              className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors"
                            >
                              View
                            </Link>
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

        {/* Empty state */}
        {!history && !loading && dbAvailable && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-12 text-center space-y-3">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400">Search for a domain or URL to view scan history.</p>
            <p className="text-slate-500 text-sm">Every scan is automatically saved when PostgreSQL is connected.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
