import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Clause } from '../types/report';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';

export function ClauseSection({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(clause.status === 'fail');
  const headingId = `clause-${clause.clauseId}`;
  const panelId = `panel-${clause.clauseId}`;

  return (
    <div className="glass-light rounded-xl overflow-hidden">
      <h3>
        <button
          id={headingId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] focus:outline-2 focus:outline-offset-[-2px] focus:outline-brand-400 transition-colors"
        >
          <span className="flex items-center gap-3 min-w-0">
            <StatusBadge status={clause.status} />
            <span className="font-mono text-sm font-semibold text-brand-300 shrink-0">
              {clause.clauseId}
            </span>
            <span className="text-slate-300 text-sm truncate">{clause.title}</span>
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            id={panelId}
            role="region"
            aria-labelledby={headingId}
          >
            <div className="border-t border-slate-700/50 px-5 py-4 space-y-3">
              {clause.findings.map((finding, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <SeverityBadge severity={finding.severity} />
                    <p className="text-slate-300 text-sm leading-relaxed">{finding.description}</p>
                  </div>
                  {finding.evidence && (
                    <pre className="bg-slate-900/80 rounded-lg p-3 text-xs text-slate-400 overflow-x-auto font-mono border border-slate-800">
                      <code>{finding.evidence}</code>
                    </pre>
                  )}
                </div>
              ))}

              {clause.recommendation && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mt-3">
                  <p className="text-xs font-semibold text-brand-300 mb-1 uppercase tracking-wide">
                    Recommendation
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{clause.recommendation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
