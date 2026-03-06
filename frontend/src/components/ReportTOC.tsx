import { useEffect, useState } from 'react';
import type { Clause } from '../types/report';

const statusDotColor: Record<Clause['status'], string> = {
  pass: 'bg-green-400',
  fail: 'bg-red-400',
  needs_review: 'bg-yellow-400',
  not_applicable: 'bg-slate-500',
};

interface ReportTOCProps {
  clauses: Clause[];
}

export function ReportTOC({ clauses }: ReportTOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const elements = clauses.map((c) =>
      document.getElementById(`clause-section-${c.clauseId}`)
    ).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [clauses]);

  function scrollToClause(clauseId: string) {
    const el = document.getElementById(`clause-section-${clauseId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <nav aria-label="Report table of contents" className="sticky top-24">
      <div className="glass-light rounded-xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Clauses
        </p>
        <ul className="space-y-0.5">
          {clauses.map((clause) => {
            const isActive = activeId === `clause-section-${clause.clauseId}`;
            return (
              <li key={clause.clauseId}>
                <button
                  onClick={() => scrollToClause(clause.clauseId)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all text-xs ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColor[clause.status]}`}
                    aria-hidden="true"
                  />
                  <span className="font-mono font-semibold shrink-0">
                    {clause.clauseId}
                  </span>
                  <span className="truncate">{clause.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
