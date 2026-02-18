import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
const loadJsPdf = () => import('jspdf');
import type { ScanReport } from '../types/report';
import { getReport } from '../api/client';
import { ClauseSection } from '../components/ClauseSection';
import { ScoreGauge } from '../components/ScoreGauge';

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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!id) return;
    getReport(id)
      .then(setReport)
      .catch(() => setError('Failed to load report.'));
  }, [id]);

  useEffect(() => {
    if (report) {
      headingRef.current?.focus();
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
  const videoClauses = report.clauses.filter((c) => c.category === 'video');
  const webClauses = report.clauses.filter((c) => c.category === 'web_content');
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
      const { jsPDF } = await loadJsPdf();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > 277) {
          pdf.addPage();
          y = margin;
        }
      };

      // Title
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EAA Compliance Report', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('by Staylive  |  EAA Stream Checker', margin, y);
      y += 12;

      // Divider
      pdf.setDrawColor(200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Summary info
      pdf.setTextColor(0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin, y);
      y += 8;

      const pct = report.summary.totalChecks > 0
        ? Math.round((report.summary.passed / report.summary.totalChecks) * 100)
        : 0;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = [
        `URL: ${report.url}`,
        `Date: ${new Date(report.scannedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        `Status: ${overallLabels[report.summary.overallStatus]}  (${pct}%)`,
        `Total Checks: ${report.summary.totalChecks}  |  Passed: ${report.summary.passed}  |  Failed: ${report.summary.failed}  |  Needs Review: ${report.summary.needsReview}`,
        `Report ID: ${report.id}`,
      ];
      for (const line of summaryLines) {
        checkPage(5);
        pdf.text(line, margin, y);
        y += 5;
      }
      y += 6;

      // Clauses
      const allClauses = [
        ...(videoClauses.length > 0
          ? [{ heading: 'Clause 7 — Video & Streaming', clauses: videoClauses }]
          : []),
        ...(webClauses.length > 0
          ? [{ heading: 'Clause 9 — Web Content (WCAG 2.1 AA)', clauses: webClauses }]
          : []),
      ];

      for (const section of allClauses) {
        checkPage(14);
        pdf.setDrawColor(200);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text(section.heading, margin, y);
        y += 8;

        for (const clause of section.clauses) {
          checkPage(10);
          // Status + clause ID + title
          const statusLabel = clause.status === 'pass' ? 'PASS' : clause.status === 'fail' ? 'FAIL' : clause.status === 'needs_review' ? 'REVIEW' : 'N/A';
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(
            clause.status === 'pass' ? 34 : clause.status === 'fail' ? 220 : 180,
            clause.status === 'pass' ? 150 : clause.status === 'fail' ? 50 : 140,
            clause.status === 'pass' ? 34 : clause.status === 'fail' ? 50 : 0,
          );
          pdf.text(`[${statusLabel}]`, margin, y);
          pdf.setTextColor(0);
          pdf.text(`${clause.clauseId} — ${clause.title}`, margin + 18, y);
          y += 5;

          // Findings
          for (const finding of clause.findings) {
            checkPage(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(80);
            const severity = `[${finding.severity.toUpperCase()}]`;
            const lines = pdf.splitTextToSize(`${severity} ${finding.description}`, contentWidth - 4);
            for (const line of lines) {
              checkPage(4);
              pdf.text(line, margin + 4, y);
              y += 4;
            }
            if (finding.evidence) {
              checkPage(4);
              pdf.setFontSize(7);
              pdf.setTextColor(120);
              const evidenceLines = pdf.splitTextToSize(finding.evidence, contentWidth - 8);
              for (const el of evidenceLines.slice(0, 3)) {
                checkPage(3.5);
                pdf.text(el, margin + 8, y);
                y += 3.5;
              }
            }
            y += 1;
          }

          // Recommendation
          if (clause.recommendation) {
            checkPage(8);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(40, 80, 160);
            const recLines = pdf.splitTextToSize(`Recommendation: ${clause.recommendation}`, contentWidth - 4);
            for (const rl of recLines) {
              checkPage(4);
              pdf.text(rl, margin + 4, y);
              y += 4;
            }
          }
          y += 3;
        }
      }

      // Footer on last page
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150);
      pdf.text('Generated by EAA Stream Checker v0.0.1 — Staylive', margin, 290);

      pdf.save(`eaa-report-${report.id}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <main id="main-content" className="flex-1 px-4 py-8">
      <motion.div
        className="max-w-5xl mx-auto space-y-8"
        variants={stagger}
        initial="hidden"
        animate="show"
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
            className="text-3xl sm:text-4xl font-extrabold text-white focus:outline-none"
          >
            Compliance Report
          </h1>
        </motion.div>

        {/* Executive Summary */}
        <motion.section variants={fadeUp} aria-labelledby="summary-heading" className="space-y-4">
          <h2 id="summary-heading" className="text-xl font-bold text-slate-200">
            Executive Summary
          </h2>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Score Gauge */}
              <div className="shrink-0">
                <ScoreGauge score={score} />
              </div>

              {/* Summary details */}
              <div className="flex-1 space-y-5 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full ring-1 ring-inset px-4 py-1.5 text-sm font-bold ${overallStyles[report.summary.overallStatus]}`}
                  >
                    {overallLabels[report.summary.overallStatus]}
                  </span>
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
                      <dd className={`text-sm font-medium text-slate-200 mt-0.5 ${item.breakAll ? 'break-all' : ''}`}>
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Stat pills */}
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
              </div>
            </div>
          </div>
        </motion.section>

        {/* Clause 7 -- Video/Streaming */}
        {videoClauses.length > 0 && (
          <motion.section variants={fadeUp} aria-labelledby="video-heading" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold font-mono text-xs">
                7
              </div>
              <div>
                <h2 id="video-heading" className="text-xl font-bold text-slate-200">
                  Video & Streaming
                </h2>
                <p className="text-xs text-slate-500">
                  EN 301 549 Clause 7 — captions, audio description, player accessibility
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {videoClauses.map((clause) => (
                <ClauseSection key={clause.clauseId} clause={clause} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Clause 9 -- Web Content */}
        {webClauses.length > 0 && (
          <motion.section variants={fadeUp} aria-labelledby="web-heading" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold font-mono text-xs">
                9
              </div>
              <div>
                <h2 id="web-heading" className="text-xl font-bold text-slate-200">
                  Web Content (WCAG 2.1 AA)
                </h2>
                <p className="text-xs text-slate-500">
                  EN 301 549 Clause 9 — Perceivable, Operable, Understandable, Robust
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {webClauses.map((clause) => (
                <ClauseSection key={clause.clauseId} clause={clause} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Export Actions */}
        <motion.section variants={fadeUp} aria-labelledby="export-heading" className="no-print space-y-4">
          <h2 id="export-heading" className="text-xl font-bold text-slate-200">
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
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download JSON
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}
