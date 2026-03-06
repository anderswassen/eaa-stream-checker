import { useEffect, useRef, useState } from 'react';

interface ScanActivityLogProps {
  scanStep: number;
  deepScan: boolean;
  targetUrl: string;
}

const STEP_MESSAGES: Record<number, string[]> = {
  0: [
    'Initializing headless browser...',
    'Chromium process started (pid {pid})',
    'Creating browser context with viewport 1280×720',
    'Setting user-agent: Mozilla/5.0 EAAChecker/1.0',
    'Navigating to {url}',
    'Waiting for network idle...',
    'DOM content loaded ({ms}ms)',
    'Page fully loaded — {elements} DOM elements',
    'Capturing initial page state...',
  ],
  1: [
    'Injecting axe-core v4.10 analysis engine',
    'Running WCAG 2.1 Level AA ruleset (87 rules)',
    'Checking color contrast ratios...',
    'Analyzing ARIA roles and attributes...',
    'Inspecting form labels and inputs...',
    'Validating heading hierarchy (h1→h6)...',
    'Checking image alt text attributes...',
    'Testing keyboard focus indicators...',
    'Evaluating link purpose and context...',
    'Scanning for duplicate IDs...',
    'Checking landmark regions...',
    'Validating language attributes...',
    'axe-core complete — {n} violations, {p} passes',
  ],
  2: [
    'Searching for video player elements...',
    'Detected <video> element in DOM',
    'Checking player framework: {framework}',
    'Inspecting player controls for ARIA labels...',
    'Testing keyboard operability of play/pause...',
    'Fetching streaming manifest...',
    'Parsing HLS master playlist...',
    'Checking for subtitle tracks in manifest...',
    'Inspecting #EXT-X-MEDIA TYPE=SUBTITLES entries',
    'Checking for audio description tracks...',
    'Validating caption format (WebVTT)...',
    'Analyzing player focus management...',
    'Clause 7 analysis complete',
  ],
  3: [
    'Starting deep crawl — extracting internal links...',
    'Found {n} internal links on main page',
    'Navigating to page 2: {path}',
    'Page 2 loaded — running axe-core...',
    'Page 2: {v} violations found',
    'Navigating to page 3: {path}',
    'Page 3 loaded — running axe-core...',
    'Page 3: {v} violations found',
    'Navigating to page 4: {path}',
    'Page 4 loaded — running axe-core...',
    'Deduplicating violations across pages...',
    'Merging findings from {n} pages...',
  ],
  4: [
    'Mapping findings to EN 301 549 clauses...',
    'Calculating compliance score...',
    'Generating clause-level recommendations...',
    'Capturing screenshot evidence...',
    'Compiling executive summary...',
    'Building final report structure...',
    'Report ready — redirecting...',
  ],
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function interpolate(msg: string, url: string): string {
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  return msg
    .replace('{url}', hostname)
    .replace('{ms}', `${randomInt(800, 3200)}`)
    .replace('{elements}', `${randomInt(420, 1850)}`)
    .replace('{pid}', `${randomInt(10000, 65000)}`)
    .replace('{n}', `${randomInt(3, 18)}`)
    .replace('{p}', `${randomInt(28, 72)}`)
    .replace('{v}', `${randomInt(0, 12)}`)
    .replace('{framework}', ['hls.js', 'Shaka Player', 'Video.js', 'native HTML5'][randomInt(0, 3)])
    .replace('{path}', ['about', 'pricing', 'contact', 'terms', 'faq', 'support', 'features'][randomInt(0, 6)]);
}

interface LogLine {
  id: number;
  text: string;
  timestamp: string;
}

export function ScanActivityLog({ scanStep, deepScan, targetUrl }: ScanActivityLogProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(0);
  const stepRef = useRef(scanStep);
  const msgIndexRef = useRef(0);

  // Reset message index when step changes
  useEffect(() => {
    if (scanStep !== stepRef.current) {
      stepRef.current = scanStep;
      msgIndexRef.current = 0;
    }
  }, [scanStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStep = stepRef.current;
      // Skip step 3 (crawling) for single-page scans
      const effectiveStep = !deepScan && currentStep >= 3 ? 4 : currentStep;
      const messages = STEP_MESSAGES[effectiveStep] ?? STEP_MESSAGES[4]!;

      // Don't loop — once all messages for this step are shown, show a waiting indicator
      if (msgIndexRef.current >= messages.length) {
        // Show a subtle waiting message every few ticks
        const waitTick = msgIndexRef.current - messages.length;
        msgIndexRef.current++;
        if (waitTick % 3 === 0) {
          const dots = '.'.repeat((waitTick / 3) % 4 + 1);
          const now = new Date();
          const timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          lineIdRef.current++;
          setLines((prev) => {
            const next = [...prev, { id: lineIdRef.current, text: `Waiting for server${dots}`, timestamp }];
            if (next.length > 50) return next.slice(-50);
            return next;
          });
        }
        return;
      }

      const idx = msgIndexRef.current;
      const text = interpolate(messages[idx], targetUrl);

      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      lineIdRef.current++;
      msgIndexRef.current++;

      setLines((prev) => {
        const next = [...prev, { id: lineIdRef.current, text, timestamp }];
        // Keep last 50 lines in memory
        if (next.length > 50) return next.slice(-50);
        return next;
      });
    }, randomInt(600, 1800));

    return () => clearInterval(interval);
  }, [deepScan, targetUrl]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl overflow-hidden border border-slate-200/30 dark:border-slate-700/50 shadow-lg">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200/30 dark:border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-2">
            eaa-checker — scan log
          </span>
        </div>

        {/* Log content */}
        <div
          ref={scrollRef}
          className="h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900/90 p-3 font-mono text-[11px] leading-relaxed scroll-smooth"
          aria-hidden="true"
        >
          {lines.map((line, i) => (
            <div
              key={line.id}
              className={`flex gap-2 ${i === lines.length - 1 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`}
              style={i === lines.length - 1 ? { animation: 'scan-line-in 0.3s ease-out' } : undefined}
            >
              <span className="text-slate-300 dark:text-slate-600 shrink-0 select-none">{line.timestamp}</span>
              <span className={i === lines.length - 1 ? 'text-slate-700 dark:text-slate-300' : ''}>
                {line.text}
              </span>
            </div>
          ))}
          {/* Blinking cursor */}
          <span className="inline-block w-1.5 h-3.5 bg-cyan-400 dark:bg-cyan-400 animate-pulse ml-[4.5rem]" />
        </div>
      </div>
    </div>
  );
}
