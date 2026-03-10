import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { startScan, getScanStatus } from '../api/client';
import { DomainDashboard } from '../components/DomainDashboard';
import { BentoScanView } from '../components/BentoScanView';
import { SEO } from '../components/SEO';
import { useScanState } from '../App';

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const exampleUrls = [
  'live.hockeyettan.se',
  'fredriksteenplay.se',
  'mnhockey.tv',
  'flyingfinn.tv',
  'svenskbilsporttv.se',
];

function useTypingPlaceholder(urls: string[], typingSpeed = 60, pauseMs = 2000) {
  const [text, setText] = useState('');
  const [urlIndex, setUrlIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    const current = urls[urlIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting) {
      if (charIndex < current.length) {
        timeout = setTimeout(() => {
          if (!active.current) return;
          setText(current.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          if (!active.current) return;
          setDeleting(true);
        }, pauseMs);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          if (!active.current) return;
          setText(current.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, typingSpeed / 2);
      } else {
        setDeleting(false);
        setUrlIndex((i) => (i + 1) % urls.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, urlIndex, urls, typingSpeed, pauseMs]);

  return text;
}

export function ScanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [deepScan, setDeepScan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setState: setScanState } = useScanState();
  const typingPlaceholder = useTypingPlaceholder(exampleUrls);
  const autoScanTriggered = useRef(false);

  // Auto-scan from ?scan=URL query param (used by History page re-scan)
  useEffect(() => {
    const scanUrl = searchParams.get('scan');
    if (scanUrl && !autoScanTriggered.current && !scanning) {
      autoScanTriggered.current = true;
      const normalized = normalizeUrl(scanUrl);
      if (isValidUrl(normalized)) {
        setUrl(scanUrl);
        setSearchParams({}, { replace: true });
        // Small delay to let state settle before triggering scan
        setTimeout(() => runScan(normalized), 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function runScan(targetUrl: string) {
    setScanning(true);
    setScanId(null);
    setError('');
    setScanState('scanning');

    try {
      const { id } = await startScan({ url: targetUrl, deepScan, maxPages: 5 });
      setScanId(id);

      // Polling fallback (SSE in BentoScanView handles the visual updates,
      // but we still poll to detect completion if SSE disconnects)
      let status = 'in_progress';
      let pollCount = 0;
      const maxPolls = deepScan ? 90 : 45;
      while (status === 'in_progress') {
        await new Promise((r) => setTimeout(r, 2000));
        pollCount++;
        if (pollCount > maxPolls) {
          throw new Error('Scan timed out. The site may be too large or the server is busy. Please try again.');
        }
        const result = await getScanStatus(id);
        status = result.status;
        if (status === 'failed') {
          const serverMsg = result.error;
          const userMsg = serverMsg?.includes('Executable doesn\'t exist')
            ? 'The server browser is not properly configured. Please contact support.'
            : serverMsg
              ? `Scan failed: ${serverMsg.slice(0, 200)}`
              : 'Scan failed. Please check the URL and try again.';
          throw new Error(userMsg);
        }
      }

      setScanState('idle');
      navigate(`/report/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
      setScanning(false);
      setScanId(null);
      setScanState('idle');
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL.');
      inputRef.current?.focus();
      return;
    }

    const normalized = normalizeUrl(url);

    if (!isValidUrl(normalized)) {
      setError('Please enter a valid URL (e.g., svtplay.se).');
      inputRef.current?.focus();
      return;
    }

    runScan(normalized);
  }

  function handleRescan(rescanUrl: string) {
    setUrl(rescanUrl);
    runScan(rescanUrl);
  }

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center px-4 gradient-mesh">
      <SEO
        title="EAA Compliance Checker — European Accessibility Act & EN 301 549 Scanner"
        description="Free EAA compliance checker for streaming services. Test your site against the European Accessibility Act (Directive 2019/882) and EN 301 549 in 30 seconds. Automated WCAG 2.2 AA audit, caption checks, audio description, player accessibility — full compliance report."
        path="/"
      />
      <div className="w-full max-w-2xl space-y-10 text-center py-16">
        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            EAA Compliance
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-brand-300 bg-clip-text text-transparent">
              30 seconds,
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">not 30 days.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Paste a URL. Get a full EN&nbsp;301&nbsp;549 compliance report for your
            streaming service — instantly.
          </p>
        </motion.div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="url-input" className="sr-only">
                  Streaming site URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    id="url-input"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={typingPlaceholder || 'https://'}

                    disabled={scanning}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'url-error' : undefined}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 pl-12 pr-4 py-4 text-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      id="url-error"
                      role="alert"
                      className="text-red-400 text-sm text-left"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Deep scan toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="deep-scan" className="flex items-center gap-2 cursor-pointer group relative">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Deep scan
                  </span>
                  <span className="text-xs text-slate-500">(up to 5 pages)</span>
                  <span className="text-slate-400 dark:text-slate-500 cursor-help" aria-hidden="true">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span
                    role="tooltip"
                    className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-0 mb-2 w-64 rounded-lg bg-slate-800 dark:bg-slate-700 text-slate-200 text-xs leading-relaxed p-3 shadow-lg z-10 pointer-events-none"
                  >
                    Crawls up to 5 internal pages from your site and merges all findings into a single report. Gives a broader compliance picture but takes longer to complete.
                  </span>
                </label>
                <button
                  id="deep-scan"
                  type="button"
                  role="switch"
                  aria-checked={deepScan}
                  disabled={scanning}
                  onClick={() => setDeepScan(!deepScan)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                    deepScan ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                      deepScan ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-6 py-4 text-lg font-bold text-white hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
              >
                {scanning ? 'Scanning...' : 'Check Compliance'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Scan progress — Bento streaming view */}
        <AnimatePresence>
          {scanning && scanId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="status"
              aria-live="polite"
            >
              <BentoScanView
                scanId={scanId}
                targetUrl={url}
                deepScan={deepScan}
                onComplete={(completedId) => navigate(`/report/${completedId}`)}
                onError={(msg) => {
                  setError(msg);
                  setScanning(false);
                  setScanId(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature highlights */}
        {!scanning && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
            >
              {[
                { icon: '7', title: 'Clause 7', desc: 'Video & streaming player checks' },
                { icon: '9', title: 'Clause 9', desc: 'WCAG 2.2 AA web content audit' },
                { icon: 'EN', title: 'EN 301 549', desc: 'Full standard compliance mapping' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="glass-light rounded-xl p-4 text-center"
                >
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 font-bold font-mono text-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
            <DomainDashboard onRescan={handleRescan} />
          </>
        )}
      </div>
    </main>
  );
}
