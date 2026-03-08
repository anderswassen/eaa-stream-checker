import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRecentDomains, getVersion } from '../api/client';
import type { DomainSummary } from '../api/client';

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-500 text-xs">--</span>;
  const color =
    score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DomainDashboard() {
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    getVersion()
      .then((v) => {
        if (v.persistence !== 'postgresql') {
          setLoading(false);
          return;
        }
        setAvailable(true);
        return getRecentDomains(8);
      })
      .then((result) => {
        if (result) setDomains(result.domains);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !available || domains.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent Scans
        </h2>
        <Link
          to="/history"
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {domains.map((d) => (
          <Link
            key={d.domain}
            to={`/history?domain=${encodeURIComponent(d.domain)}`}
            className="glass-light rounded-xl px-4 py-3 flex items-center justify-between gap-3 group hover:bg-white/[0.06] transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                {d.domain}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {d.scanCount} scan{d.scanCount !== 1 ? 's' : ''} &middot; {timeAgo(d.lastScanAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <TrendArrow current={d.latestScore} previous={d.previousScore} />
              <ScorePill score={d.latestScore} />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
