import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ScanReport } from '../types/report';
import { getReport } from '../api/client';
import { ClauseSection } from '../components/ClauseSection';

const overallLabels: Record<ScanReport['summary']['overallStatus'], string> = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  partially_compliant: 'Partially Compliant',
};

const overallStyles: Record<
  ScanReport['summary']['overallStatus'],
  string
> = {
  compliant: 'bg-green-100 text-green-800 border-green-300',
  non_compliant: 'bg-red-100 text-red-800 border-red-300',
  partially_compliant: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState('');
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
          <p className="text-red-700 text-lg">{error}</p>
          <Link
            to="/"
            className="inline-block text-blue-700 underline hover:text-blue-900 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            Back to scan
          </Link>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div role="status" aria-live="polite" className="text-center space-y-2">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
          <p className="text-gray-600">Loading report&hellip;</p>
        </div>
      </main>
    );
  }

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

  return (
    <main id="main-content" className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 underline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            <span aria-hidden="true">&larr;</span> New scan
          </Link>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-bold text-gray-900 focus:outline-none"
          >
            Compliance Report
          </h1>
        </div>

        {/* Executive Summary */}
        <section aria-labelledby="summary-heading" className="space-y-4">
          <h2
            id="summary-heading"
            className="text-2xl font-bold text-gray-900"
          >
            Executive Summary
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`rounded border px-3 py-1 text-lg font-bold ${overallStyles[report.summary.overallStatus]}`}
              >
                {overallLabels[report.summary.overallStatus]}
              </span>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm text-gray-500">URL Scanned</dt>
                <dd className="text-sm font-medium text-gray-900 break-all">
                  {report.url}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Date</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {scannedDate}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Total Checks</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {report.summary.totalChecks}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Report ID</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {report.id}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full bg-green-500"
                />
                Passed: {report.summary.passed}
              </span>
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full bg-red-500"
                />
                Failed: {report.summary.failed}
              </span>
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full bg-yellow-500"
                />
                Needs Review: {report.summary.needsReview}
              </span>
            </div>
          </div>
        </section>

        {/* Clause 7 — Video/Streaming */}
        {videoClauses.length > 0 && (
          <section aria-labelledby="video-heading" className="space-y-3">
            <h2
              id="video-heading"
              className="text-2xl font-bold text-gray-900"
            >
              Clause 7 — Video &amp; Streaming
            </h2>
            <p className="text-sm text-gray-600">
              EN 301 549 requirements specific to video content, captions, audio
              description, and player accessibility.
            </p>
            <div className="space-y-2">
              {videoClauses.map((clause) => (
                <ClauseSection key={clause.clauseId} clause={clause} />
              ))}
            </div>
          </section>
        )}

        {/* Clause 9 — Web Content */}
        {webClauses.length > 0 && (
          <section aria-labelledby="web-heading" className="space-y-3">
            <h2 id="web-heading" className="text-2xl font-bold text-gray-900">
              Clause 9 — Web Content (WCAG 2.1 AA)
            </h2>
            <p className="text-sm text-gray-600">
              Standard web accessibility findings grouped by WCAG principles:
              Perceivable, Operable, Understandable, Robust.
            </p>
            <div className="space-y-2">
              {webClauses.map((clause) => (
                <ClauseSection key={clause.clauseId} clause={clause} />
              ))}
            </div>
          </section>
        )}

        {/* Export Actions */}
        <section aria-labelledby="export-heading" className="space-y-3">
          <h2 id="export-heading" className="text-2xl font-bold text-gray-900">
            Export
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJson}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
            >
              Download JSON
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
            >
              Print Report
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
