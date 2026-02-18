import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ScanPage } from './pages/ScanPage';
import { ReportPage } from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        {/* Skip to content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
        >
          Skip to main content
        </a>

        <header className="border-b border-gray-200 bg-white" role="banner">
          <nav
            className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3"
            aria-label="Main navigation"
          >
            <Link
              to="/"
              className="text-lg font-bold text-gray-900 hover:text-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
            >
              EAA Stream Checker
            </Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/report/:id" element={<ReportPage />} />
        </Routes>

        <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
          <p>
            EAA Stream Checker — European Accessibility Act compliance tool
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
