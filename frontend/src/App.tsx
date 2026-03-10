import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ScanPage } from './pages/ScanPage';
import { ReportPage } from './pages/ReportPage';
import { HelpPage } from './pages/HelpPage';
import { HistoryPage } from './pages/HistoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const GuidePage = lazy(() => import('./pages/GuidePage').then(m => ({ default: m.GuidePage })));
const GuidesIndexPage = lazy(() => import('./pages/GuidesIndexPage').then(m => ({ default: m.GuidesIndexPage })));

// Scan state context for reactive ambient background
type ScanState = 'idle' | 'scanning' | 'passing' | 'failing';
const ScanStateContext = createContext<{ state: ScanState; setState: (s: ScanState) => void }>({ state: 'idle', setState: () => {} });
export function useScanState() { return useContext(ScanStateContext); }

const APP_VERSION = '0.9.3';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function AmbientBlobs({ state }: { state: ScanState }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className={`ambient-blob ambient-blob-1 ${state}`} />
      <div className={`ambient-blob ambient-blob-2 ${state}`} />
      <div className={`ambient-blob ambient-blob-3 ${state}`} />
    </div>
  );
}

function AppContent() {
  const [scanState, setScanState] = useState<ScanState>('idle');

  return (
    <ScanStateContext.Provider value={{ state: scanState, setState: setScanState }}>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 font-sans">
        <AmbientBlobs state={scanState} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand-400"
        >
          Skip to main content
        </a>

        <header className="glass sticky top-0 z-40" role="banner">
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
            aria-label="Main navigation"
          >
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded-lg"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                EAA Stream Checker
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/history"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded"
              >
                History
              </Link>
              <Link
                to="/guides"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded"
              >
                Guides
              </Link>
              <Link
                to="/help"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded"
              >
                Help
              </Link>
              <ThemeToggle />
              <span className="rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                v{APP_VERSION}
              </span>
            </div>
          </nav>
        </header>

        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<ScanPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            <Route path="/guides" element={<GuidesIndexPage />} />
            <Route path="/guide/:slug" element={<GuidePage />} />
          </Routes>
        </Suspense>

        <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center">
          <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-400">
                European Accessibility Act compliance tool for streaming services
              </p>
              <Link
                to="/privacy"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Privacy &amp; Data
              </Link>
              <Link
                to="/accessibility"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Accessibility
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
    </ScanStateContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
