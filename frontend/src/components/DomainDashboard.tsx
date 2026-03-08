import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRecentDomains, getVersion } from '../api/client';
import type { DomainSummary } from '../api/client';

type SortKey = 'recent' | 'score_asc' | 'score_desc' | 'scans';

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-500 text-xs">--</span>;
  const color =
    score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-lg font-bold tabular-nums ${color}`}>{score}</span>;
}

function TrendArrow({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-slate-600 text-xs">--</span>;
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

function healthBorder(score: number | null): string {
  if (score === null) return 'border-l-slate-600';
  if (score >= 90) return 'border-l-green-500';
  if (score >= 50) return 'border-l-yellow-500';
  return 'border-l-red-500';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isStale(iso: string): boolean {
  const days = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 7;
}

function sortDomains(domains: DomainSummary[], key: SortKey): DomainSummary[] {
  const sorted = [...domains];
  switch (key) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.lastScanAt).getTime() - new Date(a.lastScanAt).getTime());
    case 'score_asc':
      return sorted.sort((a, b) => (a.latestScore ?? -1) - (b.latestScore ?? -1));
    case 'score_desc':
      return sorted.sort((a, b) => (b.latestScore ?? -1) - (a.latestScore ?? -1));
    case 'scans':
      return sorted.sort((a, b) => b.scanCount - a.scanCount);
    default:
      return sorted;
  }
}

interface DomainDashboardProps {
  onRescan?: (url: string) => void;
}

export function DomainDashboard({ onRescan }: DomainDashboardProps) {
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');

  useEffect(() => {
    getVersion()
      .then((v) => {
        if (v.persistence !== 'postgresql') {
          setLoading(false);
          return;
        }
        setAvailable(true);
        return getRecentDomains(12);
      })
      .then((result) => {
        if (result) setDomains(result.domains);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Empty state: DB available but no scans yet
  if (!loading && available && domains.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full"
      >
        <div className="glass-light rounded-xl p-6 text-center space-y-2">
          <svg className="mx-auto h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-400">No scan history yet.</p>
          <p className="text-xs text-slate-500">
            Run your first scan above to start tracking compliance over time.
          </p>
        </div>
      </motion.div>
    );
  }

  if (loading || !available || domains.length === 0) return null;

  const sorted = sortDomains(domains, sort);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Monitored Domains
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs bg-transparent text-slate-500 border-none focus:outline-none cursor-pointer hover:text-slate-300 transition-colors"
            aria-label="Sort domains"
          >
            <option value="recent">Most recent</option>
            <option value="score_asc">Worst score</option>
            <option value="score_desc">Best score</option>
            <option value="scans">Most scanned</option>
          </select>
          <Link
            to="/history"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((d) => {
          const stale = isStale(d.lastScanAt);
          return (
            <div
              key={d.domain}
              className={`glass-light rounded-xl border-l-2 ${healthBorder(d.latestScore)} flex items-center justify-between gap-2 group transition-colors`}
            >
              <Link
                to={`/history?domain=${encodeURIComponent(d.domain)}`}
                className="flex-1 min-w-0 px-4 py-3 hover:bg-white/[0.04] transition-colors rounded-l-xl"
              >
                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                  {d.domain}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  {d.scanCount} scan{d.scanCount !== 1 ? 's' : ''}
                  <span className="text-slate-700">&middot;</span>
                  <span className={stale ? 'text-yellow-500' : ''}>
                    {timeAgo(d.lastScanAt)}
                    {stale && ' (stale)'}
                  </span>
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0 pr-2">
                <TrendArrow current={d.latestScore} previous={d.previousScore} />
                <ScorePill score={d.latestScore} />
                {onRescan && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onRescan(d.latestUrl);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title={`Re-scan ${d.domain}`}
                    aria-label={`Re-scan ${d.domain}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
