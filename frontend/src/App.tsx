import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ScanPage } from './pages/ScanPage';
import { ReportPage } from './pages/ReportPage';

const APP_VERSION = '0.0.1';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100 font-sans">
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
              <img
                src="/staylive-logo.png"
                alt="Staylive"
                className="h-12 w-auto brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-slate-600 text-lg font-light select-none" aria-hidden="true">|</span>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                EAA Stream Checker
              </span>
            </Link>
            <span className="rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-0.5 text-xs font-mono text-slate-400">
              v{APP_VERSION}
            </span>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/report/:id" element={<ReportPage />} />
        </Routes>

        <footer className="border-t border-slate-800/50 py-6 text-center">
          <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              European Accessibility Act compliance tool for streaming services
            </p>
            <div className="flex items-center gap-3">
              <img
                src="/staylive-logo.png"
                alt="Staylive"
                className="h-8 w-auto brightness-0 invert opacity-50"
              />
              <span className="text-sm text-slate-500 font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
