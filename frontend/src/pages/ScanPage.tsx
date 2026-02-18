import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { startScan, getScanStatus } from '../api/client';

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
  'svtplay.se',
  'tv4play.se',
  'dplay.se',
  'hockeyettan.se',
  'viaplay.se',
  'cmore.se',
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

const scanSteps = [
  { label: 'Connecting', description: 'Loading page in browser' },
  { label: 'Analyzing', description: 'Running accessibility checks' },
  { label: 'Streaming', description: 'Checking video player compliance' },
  { label: 'Finalizing', description: 'Generating report' },
];

export function ScanPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const typingPlaceholder = useTypingPlaceholder(exampleUrls);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

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

    setScanning(true);
    setScanStep(0);

    try {
      const { id } = await startScan(normalized);
      setScanStep(1);

      let status = 'in_progress';
      let pollCount = 0;
      while (status === 'in_progress') {
        await new Promise((r) => setTimeout(r, 2000));
        const result = await getScanStatus(id);
        status = result.status;
        pollCount++;
        if (status === 'in_progress') {
          if (pollCount >= 4) setScanStep(3);
          else if (pollCount >= 2) setScanStep(2);
        }
      }

      if (status === 'failed') {
        throw new Error('Scan failed. Please check the URL and try again.');
      }

      navigate(`/report/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
      setScanning(false);
      setScanStep(0);
      inputRef.current?.focus();
    }
  }

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center px-4 gradient-mesh">
      <div className="w-full max-w-2xl space-y-10 text-center py-16">
        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            EAA Compliance
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-brand-300 bg-clip-text text-transparent">
              30 seconds,
            </span>
            <br />
            <span className="text-white">not 30 days.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
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
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={typingPlaceholder || 'https://'}

                    disabled={scanning}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'url-error' : undefined}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-12 pr-4 py-4 text-lg text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        {/* Scan progress */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="status"
              aria-live="polite"
              className="space-y-6"
            >
              {/* Animated scanner orb */}
              <div className="flex justify-center">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full bg-brand-500/20 pulse-ring" />
                  <div className="absolute inset-2 rounded-full bg-brand-500/30 pulse-ring" style={{ animationDelay: '0.4s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 shadow-lg shadow-brand-500/50" />
                  </div>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-2">
                {scanSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                          i <= scanStep
                            ? 'bg-brand-400 shadow-sm shadow-brand-400/50'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span className={`text-xs transition-colors duration-300 ${
                        i === scanStep ? 'text-brand-300 font-medium' : 'text-slate-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < scanSteps.length - 1 && (
                      <div className={`h-px w-8 mb-5 transition-colors duration-500 ${
                        i < scanStep ? 'bg-brand-500' : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-slate-400 text-sm">
                {scanSteps[scanStep].description}...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature highlights */}
        {!scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
          >
            {[
              { icon: '7', title: 'Clause 7', desc: 'Video & streaming player checks' },
              { icon: '9', title: 'Clause 9', desc: 'WCAG 2.1 AA web content audit' },
              { icon: 'EN', title: 'EN 301 549', desc: 'Full standard compliance mapping' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-light rounded-xl p-4 text-center"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 font-bold font-mono text-sm">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
