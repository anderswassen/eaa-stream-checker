import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ScanReport, Clause, Finding } from '../types/report';
import { getReport, getScore, getComparison } from '../api/client';
import type { ScoreResponse, ComparisonResponse } from '../api/client';
import { ClauseSection } from '../components/ClauseSection';
import { ScoreGauge } from '../components/ScoreGauge';
import { RadarChart } from '../components/RadarChart';
import { FilterBar } from '../components/FilterBar';
import { ReportTOC } from '../components/ReportTOC';
import { SEO } from '../components/SEO';
import { exportPdf } from '../utils/pdfExport';
import { exportVpat } from '../utils/vpatExport';

const overallLabels: Record<ScanReport['summary']['overallStatus'], string> = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  partially_compliant: 'Partially Compliant',
};

const overallStyles: Record<ScanReport['summary']['overallStatus'], string> = {
  compliant: 'bg-green-500/10 text-green-400 ring-green-500/20',
  non_compliant: 'bg-red-500/10 text-red-400 ring-red-500/20',
  partially_compliant: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
};

function computeScore(summary: ScanReport['summary']): number {
  if (summary.totalChecks === 0) return 0;
  return Math.round((summary.passed / summary.totalChecks) * 100);
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingVpat, setExportingVpat] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<Set<Clause['status']>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<Finding['severity']>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<Clause['category']>>(new Set());

  useEffect(() => {
    if (!id) return;
    getReport(id)
      .then(setReport)
      .catch(() => setError('Failed to load report.'));
  }, [id]);

  // Fetch historical score data and comparison when report loads
  useEffect(() => {
    if (!report) return;
    getScore(report.url).then(setScoreData).catch(() => {});
    getComparison(report.id).then(setComparison).catch(() => {});
  }, [report]);

  useEffect(() => {
    if (report) {
      headingRef.current?.focus();
      // Trigger cascade reveal after score gauge animation
      const timer = setTimeout(() => setRevealed(true), 800);
      return () => clearTimeout(timer);
    }
  }, [report]);

  if (error) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div role="alert" className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-lg">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to scan
          </Link>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div role="status" aria-live="polite" className="text-center space-y-3">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full bg-brand-500/20 pulse-ring" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400" />
            </div>
          </div>
          <p className="text-slate-400">Loading report...</p>
        </div>
      </main>
    );
  }

  const score = computeScore(report.summary);

  // Apply filters
  const filteredClauses = report.clauses.filter((c) => {
    if (statusFilter.size > 0 && !statusFilter.has(c.status)) return false;
    if (categoryFilter.size > 0 && !categoryFilter.has(c.category)) return false;
    if (severityFilter.size > 0) {
      // Severity filter only applies to non-pass clauses (actual issues)
      if (c.status === 'pass' || c.status === 'not_applicable') return false;
      const hasSeverity = c.findings.some((f) => severityFilter.has(f.severity));
      if (!hasSeverity && c.findings.length > 0) return false;
      if (c.findings.length === 0 && !severityFilter.has('minor')) return false;
    }
    return true;
  });

  // Build change map from comparison data
  const changeMap = new Map<string, 'regression' | 'fixed' | 'new_issue'>();
  if (comparison?.hasPrevious) {
    for (const c of comparison.changes) {
      changeMap.set(c.clauseId, c.change);
    }
  }

  const videoClauses = filteredClauses.filter((c) => c.category === 'video');
  const webClauses = filteredClauses.filter((c) => c.category === 'web_content');
  const scannedDate = new Date(report.scannedAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eaa-report-${report!.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    if (!report) return;
    setExportingPdf(true);
    try {
      await exportPdf(report);
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleExportVpat() {
    if (!report) return;
    setExportingVpat(true);
    try {
      await exportVpat(report);
    } finally {
      setExportingVpat(false);
    }
  }

  return (
    <main id="main-content" className="flex-1 px-4 py-8">
      <SEO
        title={`Compliance Report — ${report.url}`}
        description={`EN 301 549 compliance report for ${report.url}. Score: ${computeScore(report.summary)}/100, ${report.summary.passed} passed, ${report.summary.failed} failed.`}
        path={`/report/${id}`}
        noindex
      />
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="space-y-4">
            <Link
              to="/"
              className="no-print inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 rounded"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New scan
            </Link>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white focus:outline-none"
            >
              Compliance Report
            </h1>
          </motion.div>

          {/* Executive Summary */}
          <motion.section variants={fadeUp} aria-labelledby="summary-heading" className="space-y-4">
            <h2 id="summary-heading" className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Executive Summary
            </h2>

            <div className="glass rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="shrink-0 flex flex-col sm:flex-row items-center gap-6">
                  <ScoreGauge score={score} />
                  <RadarChart clauses={report.clauses} size={180} />
                </div>

                <div className="flex-1 space-y-5 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full ring-1 ring-inset px-4 py-1.5 text-sm font-bold ${overallStyles[report.summary.overallStatus]}`}
                    >
                      {overallLabels[report.summary.overallStatus]}
                    </span>
                    {report.deepScan && report.pagesScanned && (
                      <span className="rounded-full ring-1 ring-inset px-3 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-400 ring-cyan-500/20">
                        Deep Scan — {report.pagesScanned.length} pages
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'URL Scanned', value: report.url, breakAll: true },
                      { label: 'Date', value: scannedDate },
                      { label: 'Total Checks', value: report.summary.totalChecks },
                      { label: 'Report ID', value: report.id },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</dt>
                        <dd className={`text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5 ${item.breakAll ? 'break-all' : ''}`}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-400">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-400" />
                      {report.summary.passed} Passed
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-400" />
                      {report.summary.failed} Failed
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm font-medium text-yellow-400">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-yellow-400" />
                      {report.summary.needsReview} Needs Review
                    </span>
                  </div>

                  {/* Historical trend (only when DB is connected and has history) */}
                  {scoreData && scoreData.scanCount > 1 && (
                    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Trend</span>
                        {scoreData.trend === 'improving' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                            Improving
                          </span>
                        )}
                        {scoreData.trend === 'declining' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-400">
                            <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                            Declining
                          </span>
                        )}
                        {scoreData.trend === 'stable' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" /></svg>
                            Stable
                          </span>
                        )}
                      </div>
                      {scoreData.previousScore !== null && (
                        <span className="text-xs text-slate-500">
                          Previous: <span className="font-medium text-slate-400">{scoreData.previousScore}%</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Avg: <span className="font-medium text-slate-400">{scoreData.averageScore}%</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Scans: <span className="font-medium text-slate-400">{scoreData.scanCount}</span>
                      </span>
                      <Link
                        to={`/history?domain=${encodeURIComponent(new URL(report.url).hostname)}`}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors ml-auto"
                      >
                        View history
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Export Actions */}
          <motion.section variants={fadeUp} aria-labelledby="export-heading" className="no-print space-y-4">
            <h2 id="export-heading" className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Export
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-brand-500 hover:to-cyan-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exportingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handleExportVpat}
                disabled={exportingVpat}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-brand-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exportingVpat ? 'Generating VPAT...' : 'Export VPAT / ACR'}
              </button>
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          </motion.section>

          {/* Pages scanned (deep scan) */}
          {report.deepScan && report.pagesScanned && report.pagesScanned.length > 1 && (
            <motion.section variants={fadeUp} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Pages Scanned
              </h2>
              <div className="glass-light rounded-xl divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {report.pagesScanned.map((page) => (
                  <div key={page.url} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{page.title}</p>
                      <p className="text-xs text-slate-500 truncate">{page.url}</p>
                    </div>
                    <span className={`shrink-0 ml-3 text-xs font-semibold ${
                      page.violationCount > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {page.violationCount} violation{page.violationCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Comparison summary (regressions / fixes since last scan) */}
          {comparison?.hasPrevious && comparison.changes.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Changes Since Last Scan
              </h2>
              <div className="glass-light rounded-xl p-4 space-y-2">
                {comparison.changes.filter(c => c.change === 'regression').length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
                      <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                      {comparison.changes.filter(c => c.change === 'regression').length} Regression{comparison.changes.filter(c => c.change === 'regression').length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-500">
                      {comparison.changes.filter(c => c.change === 'regression').map(c => c.clauseId).join(', ')}
                    </span>
                  </div>
                )}
                {comparison.changes.filter(c => c.change === 'fixed').length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      {comparison.changes.filter(c => c.change === 'fixed').length} Fixed
                    </span>
                    <span className="text-xs text-slate-500">
                      {comparison.changes.filter(c => c.change === 'fixed').map(c => c.clauseId).join(', ')}
                    </span>
                  </div>
                )}
                {comparison.changes.filter(c => c.change === 'new_issue').length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {comparison.changes.filter(c => c.change === 'new_issue').length} New Issue{comparison.changes.filter(c => c.change === 'new_issue').length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-500">
                      {comparison.changes.filter(c => c.change === 'new_issue').map(c => c.clauseId).join(', ')}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-500 pt-1">
                  Compared with scan from {new Date(comparison.previousScanDate!).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </motion.section>
          )}

          {/* Filters + Content layout */}
          <motion.div variants={fadeUp}>
            <div className="no-print mb-6">
              <FilterBar
                clauses={report.clauses}
                statusFilter={statusFilter}
                severityFilter={severityFilter}
                categoryFilter={categoryFilter}
                onStatusChange={setStatusFilter}
                onSeverityChange={setSeverityFilter}
                onCategoryChange={setCategoryFilter}
              />
            </div>

            <div className="flex gap-8">
              {/* TOC sidebar */}
              <aside className="hidden lg:block w-56 shrink-0 no-print">
                <ReportTOC clauses={filteredClauses} />
              </aside>

              {/* Clause sections */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Clause 7 -- Video/Streaming */}
                {videoClauses.length > 0 && (
                  <section aria-labelledby="video-heading" className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold font-mono text-xs">
                        7
                      </div>
                      <div>
                        <h2 id="video-heading" className="text-xl font-bold text-slate-800 dark:text-slate-200">
                          Video & Streaming
                        </h2>
                        <p className="text-xs text-slate-500">
                          EN 301 549 Clause 7 — captions, audio description, player accessibility
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {videoClauses.map((clause, i) => (
                        <div
                          key={clause.clauseId}
                          id={`clause-section-${clause.clauseId}`}
                          className={`scroll-mt-24 ${revealed ? 'clause-reveal' : 'opacity-0'}`}
                          style={revealed ? { animationDelay: `${i * 60}ms` } : undefined}
                        >
                          <ClauseSection clause={clause} change={changeMap.get(clause.clauseId)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Clause 9 -- Web Content */}
                {webClauses.length > 0 && (
                  <section aria-labelledby="web-heading" className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold font-mono text-xs">
                        9
                      </div>
                      <div>
                        <h2 id="web-heading" className="text-xl font-bold text-slate-800 dark:text-slate-200">
                          Web Content (WCAG 2.1 AA)
                        </h2>
                        <p className="text-xs text-slate-500">
                          EN 301 549 Clause 9 — Perceivable, Operable, Understandable, Robust
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {webClauses.map((clause, i) => (
                        <div
                          key={clause.clauseId}
                          id={`clause-section-${clause.clauseId}`}
                          className={`scroll-mt-24 ${revealed ? 'clause-reveal' : 'opacity-0'}`}
                          style={revealed ? { animationDelay: `${(videoClauses.length + i) * 60}ms` } : undefined}
                        >
                          <ClauseSection clause={clause} change={changeMap.get(clause.clauseId)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {filteredClauses.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No clauses match the current filters.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}
