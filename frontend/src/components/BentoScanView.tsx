import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScanProgressEvent } from './bentoTypes';
import { ScanActivityLog } from './ScanActivityLog';

export type { ScanProgressEvent };

interface BentoScanViewProps {
  scanId: string;
  targetUrl: string;
  deepScan: boolean;
  onComplete: (id: string) => void;
  onError: (message: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const phaseLabels: Record<string, { label: string; icon: string }> = {
  connecting: { label: 'Connecting', icon: '🔗' },
  analyzing: { label: 'Analyzing Web Content', icon: '🔍' },
  web_complete: { label: 'Web Audit Complete', icon: '✓' },
  streaming: { label: 'Checking Video Player', icon: '▶' },
  streaming_complete: { label: 'Video Analysis Complete', icon: '✓' },
  crawling: { label: 'Deep Scanning Pages', icon: '📄' },
  mapping: { label: 'Mapping to EN 301 549', icon: '🗺' },
  complete: { label: 'Report Ready', icon: '✓' },
};

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-light rounded-xl p-5 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-20 rounded bg-slate-300/20 dark:bg-slate-700/40" />
        <div className="h-8 w-16 rounded bg-slate-300/20 dark:bg-slate-700/40" />
        <div className="h-2 w-full rounded bg-slate-300/10 dark:bg-slate-700/20" />
      </div>
    </div>
  );
}

function BentoCard({
  title,
  ready,
  children,
  className = '',
  span = '',
}: {
  title: string;
  ready: boolean;
  children: React.ReactNode;
  className?: string;
  span?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {ready ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`glass-light rounded-xl p-5 bento-card ${span} ${className}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{title}</p>
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="skeleton"
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={span}
        >
          <SkeletonCard className={className} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreRing({ score, size = 120 }: { score: number | null; size?: number }) {
  const [anim, setAnim] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (score === null) return;
    const duration = 1200;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnim(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const displayScore = score !== null ? Math.round(score * anim) : null;
  const dashOffset = score !== null ? circumference - (score * anim / 100) * circumference : circumference;
  const color = score === null ? '#475569' : score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className="stroke-slate-200/20 dark:stroke-slate-700/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {displayScore !== null ? (
          <>
            <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{displayScore}</span>
            <span className="text-[10px] text-slate-500">/ 100</span>
          </>
        ) : (
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

export function BentoScanView({ scanId, targetUrl, deepScan, onComplete, onError }: BentoScanViewProps) {
  const [phase, setPhase] = useState('connecting');
  const [webData, setWebData] = useState<{ passed: number; failed: number; incomplete: number } | null>(null);
  const [streamData, setStreamData] = useState<{ playerType: string | null; hasCaptions: boolean; hasAudioDescription: boolean } | null>(null);
  const [pageProgress, setPageProgress] = useState<{ current: number; total: number; url: string } | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Map phases to scan steps for ScanActivityLog compatibility
  const phaseToStep: Record<string, number> = {
    connecting: 0,
    analyzing: 1,
    web_complete: 2,
    streaming: 2,
    streaming_complete: 3,
    crawling: 3,
    mapping: deepScan ? 4 : 3,
    complete: deepScan ? 5 : 4,
  };

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/scan/${scanId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: ScanProgressEvent = JSON.parse(e.data);

        if (data.type === 'phase') {
          setPhase(data.phase ?? 'connecting');
          setScanStep(phaseToStep[data.phase ?? 'connecting'] ?? 0);
        } else if (data.type === 'web_complete') {
          setWebData({ passed: data.passed ?? 0, failed: data.failed ?? 0, incomplete: data.incomplete ?? 0 });
          setPhase('web_complete');
          setScanStep(2);
        } else if (data.type === 'streaming_complete') {
          setStreamData({
            playerType: data.playerType ?? null,
            hasCaptions: data.hasCaptions ?? false,
            hasAudioDescription: data.hasAudioDescription ?? false,
          });
          setPhase('streaming_complete');
          setScanStep(3);
        } else if (data.type === 'page_scanned') {
          setPageProgress({
            current: data.pageCurrent ?? 0,
            total: data.pageTotal ?? 0,
            url: data.pageUrl ?? '',
          });
        } else if (data.type === 'complete') {
          setScore(data.score ?? 0);
          setPhase('complete');
          setScanStep(deepScan ? 5 : 4);
          es.close();
          setTimeout(() => onComplete(data.id ?? scanId), 1500);
        } else if (data.type === 'error') {
          es.close();
          onError(data.message ?? 'Scan failed');
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      // SSE connection lost — fall back to polling
      es.close();
    };

    return () => {
      es.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  const progress = (() => {
    const total = deepScan ? 6 : 5;
    const step = phaseToStep[phase] ?? 0;
    return Math.round((step / total) * 100);
  })();

  const hostname = (() => {
    try { return new URL(targetUrl).hostname; } catch { return targetUrl; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      {/* URL being scanned */}
      <div className="text-center space-y-1">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Scanning</p>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 truncate">{hostname}</p>
      </div>

      {/* Progress bar */}
      <div className="glass-light rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-center text-xs text-slate-500">
        {phaseLabels[phase]?.label ?? 'Working...'} — {progress}%
      </p>

      {/* Bento grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Score card — spans 2 cols */}
        <BentoCard title="EAA Score" ready={score !== null} span="col-span-2 row-span-2" className="flex flex-col items-center justify-center min-h-[180px]">
          <ScoreRing score={score} />
          {score !== null && (
            <p className={`mt-2 text-sm font-semibold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {score >= 80 ? 'Compliant' : score >= 50 ? 'Partially Compliant' : 'Non-Compliant'}
            </p>
          )}
        </BentoCard>

        {/* Web Content card */}
        <BentoCard title="Web Content" ready={webData !== null} className="min-h-[84px]">
          {webData && (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-green-400">{webData.passed}</span>
                <span className="text-xs text-slate-500">passed</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs tabular-nums">
                  <span className="text-red-400 font-semibold">{webData.failed}</span>
                  <span className="text-slate-500"> failed</span>
                </span>
                <span className="text-xs tabular-nums">
                  <span className="text-yellow-400 font-semibold">{webData.incomplete}</span>
                  <span className="text-slate-500"> review</span>
                </span>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Streaming card */}
        <BentoCard title="Video & Streaming" ready={streamData !== null} className="min-h-[84px]">
          {streamData && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-300">
                {streamData.playerType ? streamData.playerType : 'No player detected'}
              </p>
              <div className="flex gap-2">
                <span className={`inline-flex items-center gap-1 text-xs ${streamData.hasCaptions ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  CC
                </span>
                <span className={`inline-flex items-center gap-1 text-xs ${streamData.hasAudioDescription ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  AD
                </span>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Deep scan progress card */}
        {deepScan && (
          <BentoCard
            title="Deep Scan"
            ready={pageProgress !== null}
            span="col-span-2"
            className="min-h-[60px]"
          >
            {pageProgress && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Page {pageProgress.current} / {pageProgress.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400/70 rounded-full transition-all duration-500"
                    style={{ width: `${(pageProgress.current / pageProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 truncate">{pageProgress.url}</p>
              </div>
            )}
          </BentoCard>
        )}
      </div>

      {/* Compact activity log */}
      <div className="max-h-40 overflow-hidden">
        <ScanActivityLog scanStep={scanStep} deepScan={deepScan} targetUrl={targetUrl} />
      </div>
    </motion.div>
  );
}
