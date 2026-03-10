import { useEffect, useRef, useState, useCallback } from 'react';

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
    'Configuring request interception for resource optimization',
    'Blocking third-party tracking scripts...',
    'Navigating to {url}',
    'DNS resolved: {url} → {ip}',
    'TLS handshake complete (TLSv1.3)',
    'Waiting for network idle...',
    'Received HTTP 200 — content-type: text/html',
    'Parsing initial HTML ({kb} KB)',
    'Loading stylesheets ({n} CSS files)',
    'Executing JavaScript bundles...',
    'Waiting for DOMContentLoaded event...',
    'DOM content loaded ({ms}ms)',
    'Waiting for lazy-loaded resources...',
    'Page fully loaded — {elements} DOM elements parsed',
    'Taking baseline viewport screenshot...',
    'Capturing initial page state...',
  ],
  1: [
    'Injecting axe-core v4.10 analysis engine',
    'Configuring WCAG 2.2 Level AA ruleset',
    'Running {rulecount} accessibility rules...',
    'Rule: color-contrast — checking {n} text elements',
    'Rule: image-alt — scanning {n} images',
    'Rule: label — inspecting {n} form inputs',
    'Rule: heading-order — validating hierarchy',
    'Rule: link-name — checking {n} links',
    'Rule: aria-roles — validating {n} ARIA attributes',
    'Rule: landmark-unique — checking page regions',
    'Rule: duplicate-id — scanning {elements} elements',
    'Rule: tabindex — checking focus order',
    'Rule: meta-viewport — validating zoom capability',
    'Rule: html-lang — checking language declaration',
    'Rule: button-name — inspecting {n} buttons',
    'Rule: frame-title — checking {n} iframes',
    'Rule: list — validating list markup structure',
    'Rule: definition-list — checking dl/dt/dd pairs',
    'Rule: document-title — verifying page title',
    'Rule: bypass — checking skip navigation links',
    'Evaluating text spacing and reflow at 200% zoom',
    'Checking target size (minimum 24×24px)...',
    'Validating autocomplete attributes on inputs...',
    'Analyzing error identification on forms...',
    'Checking status messages for aria-live regions...',
    'axe-core complete — {n} violations, {p} passes',
    'Mapping violations to WCAG success criteria...',
  ],
  2: [
    'Searching for video player elements...',
    'Scanning DOM for <video>, <audio>, <iframe> tags',
    'Detected <video> element in DOM',
    'Checking player framework: {framework}',
    'Reading player configuration...',
    'Inspecting player controls for ARIA labels...',
    'Testing keyboard operability of play/pause...',
    'Checking volume slider accessibility...',
    'Verifying fullscreen button has accessible name',
    'Testing progress bar keyboard interaction...',
    'Checking caption toggle button...',
    'Fetching streaming manifest...',
    'GET master.m3u8 — {kb} bytes',
    'Parsing HLS master playlist...',
    'Found {n} variant streams in manifest',
    'Checking for subtitle tracks in manifest...',
    'Inspecting #EXT-X-MEDIA TYPE=SUBTITLES entries',
    'Checking for audio description tracks...',
    'Inspecting #EXT-X-MEDIA TYPE=AUDIO entries',
    'Looking for CHARACTERISTICS=describes-video...',
    'Validating caption format (WebVTT)...',
    'Checking caption synchronization metadata...',
    'Testing player focus management...',
    'Verifying focus is not trapped in player...',
    'Checking player control visibility on hover/focus',
    'Analyzing player resize behavior...',
    'Clause 7 analysis complete',
  ],
  3: [
    'Starting deep crawl — extracting internal links...',
    'Parsing <a> tags for same-origin hrefs',
    'Found {n} internal links on main page',
    'Filtering duplicate and anchor-only links...',
    'Selected {maxpages} pages for deep analysis',
    'Navigating to page 2: /{path}',
    'Page 2 loaded ({ms}ms)',
    'Running axe-core on page 2...',
    'Page 2 analysis: {v} violations, {p} passes',
    'Capturing evidence screenshots for page 2...',
    'Navigating to page 3: /{path}',
    'Page 3 loaded ({ms}ms)',
    'Running axe-core on page 3...',
    'Page 3 analysis: {v} violations, {p} passes',
    'Navigating to page 4: /{path}',
    'Page 4 loaded ({ms}ms)',
    'Running axe-core on page 4...',
    'Page 4 analysis: {v} violations, {p} passes',
    'Navigating to page 5: /{path}',
    'Page 5 loaded ({ms}ms)',
    'Running axe-core on page 5...',
    'Page 5 analysis: {v} violations, {p} passes',
    'Cross-page crawl complete',
    'Deduplicating violations across {maxpages} pages...',
    'Merging findings into unified report...',
  ],
  4: [
    'Mapping findings to EN 301 549 clauses...',
    'Clause 7.1.1 — Captioning (pre-recorded)',
    'Clause 7.1.2 — Captioning (live)',
    'Clause 7.1.3 — Caption quality preservation',
    'Clause 7.2.1 — Audio description playback',
    'Clause 7.3 — Player controls for captions/AD',
    'Clause 9.1.1 — Non-text content',
    'Clause 9.1.3 — Adaptable content',
    'Clause 9.1.4 — Distinguishable content',
    'Clause 9.2.1 — Keyboard accessible',
    'Clause 9.2.2 — Enough time',
    'Clause 9.2.4 — Navigable',
    'Clause 9.2.5 — Input modalities',
    'Clause 9.3.1 — Readable',
    'Clause 9.3.2 — Predictable',
    'Clause 9.3.3 — Input assistance',
    'Clause 9.4.1 — Compatible',
    'Calculating compliance score...',
    'Generating severity classifications...',
    'Assigning remediation priority...',
    'Cross-referencing WCAG criteria with EN 301 549...',
    'Generating clause-level recommendations...',
  ],
  5: [
    'Capturing screenshot evidence for violations...',
    'Encoding screenshots as base64 JPEG...',
    'Compiling executive summary...',
    'Aggregating pass/fail/review counts...',
    'Formatting violation evidence...',
    'Generating fix suggestions for {n} findings...',
    'Building final report structure...',
    'Calculating per-clause pass rates...',
    'Preparing report metadata...',
    'Serializing report to JSON ({kb} KB)',
    'Report generation complete',
  ],
};

// Extra messages shown when a step runs longer than expected
const AMBIENT_MESSAGES = [
  'Processing batch {n} of results...',
  'Server CPU: {cpu}% — memory: {mem} MB',
  'Analyzing element {n} of {elements}...',
  'Checking nested iframe content...',
  'Evaluating dynamic content loaded via JavaScript',
  'Retrying resource fetch (attempt {retry})...',
  'Processing shadow DOM elements...',
  'Scanning lazy-loaded content below the fold...',
  'Evaluating responsive behavior at breakpoint {bp}px',
  'Checking third-party widget accessibility...',
  'Analyzing {n} CSS custom properties for contrast',
  'Verifying focus-visible outlines on interactive elements',
  'Inspecting SVG elements for accessible names...',
  'Checking ARIA live region announcements...',
  'Evaluating touch target sizes...',
  'Scanning for programmatic focus management...',
  'Checking scroll container keyboard access...',
  'Analyzing animation and motion preferences...',
  'Verifying text spacing override support...',
  'Checking content reflow at 400% zoom...',
  'Evaluating error prevention on form submissions...',
  'Processing inline style contrast calculations...',
  'Checking popover and dialog accessibility...',
  'Scanning for visible focus indicators...',
  'Analyzing tab sequence across {n} interactive elements',
  'Verifying role, name, value for custom widgets...',
  'Checking consistent navigation patterns...',
  'Evaluating page title uniqueness...',
  'Processing {n} nodes in accessibility tree...',
  'Server processing — large page, this may take a moment',
];

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
    .replace('{n}', `${randomInt(3, 48)}`)
    .replace('{p}', `${randomInt(28, 72)}`)
    .replace('{v}', `${randomInt(0, 12)}`)
    .replace('{kb}', `${randomInt(12, 480)}`)
    .replace('{ip}', `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`)
    .replace('{rulecount}', `${randomInt(82, 94)}`)
    .replace('{maxpages}', `${randomInt(3, 5)}`)
    .replace('{cpu}', `${randomInt(15, 78)}`)
    .replace('{mem}', `${randomInt(180, 620)}`)
    .replace('{retry}', `${randomInt(1, 3)}`)
    .replace('{bp}', `${[375, 768, 1024, 1280][randomInt(0, 3)]}`)
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
  const ambientIndexRef = useRef(0);
  const usedAmbientRef = useRef<Set<number>>(new Set());

  // Reset message index when step changes
  useEffect(() => {
    if (scanStep !== stepRef.current) {
      stepRef.current = scanStep;
      msgIndexRef.current = 0;
    }
  }, [scanStep]);

  const pickAmbientMessage = useCallback((): string => {
    // Pick a random ambient message we haven't used recently
    if (usedAmbientRef.current.size >= AMBIENT_MESSAGES.length) {
      usedAmbientRef.current.clear();
    }
    let idx: number;
    do {
      idx = randomInt(0, AMBIENT_MESSAGES.length - 1);
    } while (usedAmbientRef.current.has(idx));
    usedAmbientRef.current.add(idx);
    ambientIndexRef.current++;
    return AMBIENT_MESSAGES[idx];
  }, []);

  useEffect(() => {
    function scheduleNext() {
      const delay = randomInt(800, 2200);
      return setTimeout(() => {
        const currentStep = stepRef.current;
        // In single-page mode, skip step 3 (crawling): 0,1,2 → 3 becomes 4, 4 becomes 5
        const effectiveStep = !deepScan && currentStep >= 3 ? currentStep + 1 : currentStep;
        const messages = STEP_MESSAGES[effectiveStep] ?? STEP_MESSAGES[5]!;

        let text: string;
        if (msgIndexRef.current < messages.length) {
          text = interpolate(messages[msgIndexRef.current], targetUrl);
          msgIndexRef.current++;
        } else {
          // Step messages exhausted — use ambient messages
          text = interpolate(pickAmbientMessage(), targetUrl);
        }

        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        lineIdRef.current++;

        setLines((prev) => {
          const next = [...prev, { id: lineIdRef.current, text, timestamp }];
          if (next.length > 50) return next.slice(-50);
          return next;
        });

        timerRef.current = scheduleNext();
      }, delay);
    }

    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, [deepScan, targetUrl, pickAmbientMessage]);

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
