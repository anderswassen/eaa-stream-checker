import { useState } from 'react';
import type { Clause } from '../types/report';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';

export function ClauseSection({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(clause.status === 'fail');
  const headingId = `clause-${clause.clauseId}`;
  const panelId = `panel-${clause.clauseId}`;

  return (
    <div className="border border-gray-200 rounded-lg">
      <h3>
        <button
          id={headingId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:outline-2 focus:outline-offset-[-2px] focus:outline-blue-600 rounded-lg"
        >
          <span className="flex items-center gap-3">
            <StatusBadge status={clause.status} />
            <span className="font-semibold text-gray-900">
              {clause.clauseId}
            </span>
            <span className="text-gray-700">{clause.title}</span>
          </span>
          <span aria-hidden="true" className="text-gray-400 text-lg">
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        </button>
      </h3>

      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="border-t border-gray-200 px-4 py-3 space-y-3"
        >
          {clause.findings.map((finding, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <SeverityBadge severity={finding.severity} />
                <p className="text-gray-800 text-sm">{finding.description}</p>
              </div>
              {finding.evidence && (
                <pre className="bg-gray-100 rounded p-2 text-xs text-gray-700 overflow-x-auto">
                  <code>{finding.evidence}</code>
                </pre>
              )}
            </div>
          ))}

          {clause.recommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Recommendation
              </p>
              <p className="text-sm text-blue-800">{clause.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
