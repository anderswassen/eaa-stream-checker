import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Clause } from '../types/report';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { FixSuggestion } from './FixSuggestion';

export function ClauseSection({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(clause.status === 'fail');
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
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
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] focus:outline-2 focus:outline-offset-[-2px] focus:outline-brand-400 transition-colors"
        >
          <span className="flex items-center gap-3 min-w-0">
            <StatusBadge status={clause.status} />
            <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-300 shrink-0">
              {clause.clauseId}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-sm truncate">{clause.title}</span>
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
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 px-5 py-4 space-y-3">
              {clause.findings.map((finding, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <SeverityBadge severity={finding.severity} />
                    <div className="min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{finding.description}</p>
                      {finding.pageUrl && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Source: {finding.pageUrl}
                        </p>
                      )}
                    </div>
                  </div>
                  {finding.evidence && (
                    <pre className="bg-slate-100/80 dark:bg-slate-900/80 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto font-mono border border-slate-200 dark:border-slate-800">
                      <code>{finding.evidence}</code>
                    </pre>
                  )}
                  {finding.screenshot && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedScreenshot(
                          expandedScreenshot === finding.screenshot ? null : finding.screenshot!
                        )}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {expandedScreenshot === finding.screenshot ? 'Hide screenshot' : 'View screenshot'}
                      </button>
                      <AnimatePresence>
                        {expandedScreenshot === finding.screenshot && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <img
                              src={finding.screenshot}
                              alt={`Screenshot of violation: ${finding.description}`}
                              className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 max-w-full max-h-64 object-contain bg-slate-100/50 dark:bg-slate-900/50"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {clause.status === 'fail' && (
                    <FixSuggestion finding={finding} clauseId={clause.clauseId} />
                  )}
                </div>
              ))}

              {clause.recommendation && (
                <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mt-3">
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-300 mb-1 uppercase tracking-wide">
                    Recommendation
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{clause.recommendation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
