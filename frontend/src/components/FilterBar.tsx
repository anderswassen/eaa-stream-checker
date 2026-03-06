import type { Clause, Finding } from '../types/report';

interface FilterBarProps {
  clauses: Clause[];
  statusFilter: Set<Clause['status']>;
  severityFilter: Set<Finding['severity']>;
  categoryFilter: Set<Clause['category']>;
  onStatusChange: (s: Set<Clause['status']>) => void;
  onSeverityChange: (s: Set<Finding['severity']>) => void;
  onCategoryChange: (s: Set<Clause['category']>) => void;
}

function Chip({
  label,
  count,
  active,
  colorClass,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? `${colorClass} ring-1 ring-inset ring-current/20`
          : 'bg-slate-200/80 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
      aria-pressed={active}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        active ? 'bg-black/5 dark:bg-white/10' : 'bg-slate-300/50 dark:bg-slate-700/50'
      }`}>
        {count}
      </span>
    </button>
  );
}

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function FilterBar({
  clauses,
  statusFilter,
  severityFilter,
  categoryFilter,
  onStatusChange,
  onSeverityChange,
  onCategoryChange,
}: FilterBarProps) {
  const statusCounts = {
    pass: clauses.filter((c) => c.status === 'pass').length,
    fail: clauses.filter((c) => c.status === 'fail').length,
    needs_review: clauses.filter((c) => c.status === 'needs_review').length,
    not_applicable: clauses.filter((c) => c.status === 'not_applicable').length,
  };

  const severityCounts = { critical: 0, major: 0, minor: 0 };
  for (const c of clauses) {
    for (const f of c.findings) {
      severityCounts[f.severity]++;
    }
  }

  const categoryCounts = {
    video: clauses.filter((c) => c.category === 'video').length,
    web_content: clauses.filter((c) => c.category === 'web_content').length,
  };

  const hasActiveFilters = statusFilter.size > 0 || severityFilter.size > 0 || categoryFilter.size > 0;

  return (
    <div className="glass-light rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-500">
          Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={() => {
              onStatusChange(new Set());
              onSeverityChange(new Set());
              onCategoryChange(new Set());
            }}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Pass" count={statusCounts.pass} active={statusFilter.has('pass')} colorClass="bg-green-500/10 text-green-400" onClick={() => onStatusChange(toggleSet(statusFilter, 'pass'))} />
        <Chip label="Fail" count={statusCounts.fail} active={statusFilter.has('fail')} colorClass="bg-red-500/10 text-red-400" onClick={() => onStatusChange(toggleSet(statusFilter, 'fail'))} />
        <Chip label="Review" count={statusCounts.needs_review} active={statusFilter.has('needs_review')} colorClass="bg-yellow-500/10 text-yellow-400" onClick={() => onStatusChange(toggleSet(statusFilter, 'needs_review'))} />
        {statusCounts.not_applicable > 0 && (
          <Chip label="N/A" count={statusCounts.not_applicable} active={statusFilter.has('not_applicable')} colorClass="bg-slate-500/10 text-slate-400" onClick={() => onStatusChange(toggleSet(statusFilter, 'not_applicable'))} />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Critical" count={severityCounts.critical} active={severityFilter.has('critical')} colorClass="bg-red-500/15 text-red-300" onClick={() => onSeverityChange(toggleSet(severityFilter, 'critical'))} />
        <Chip label="Major" count={severityCounts.major} active={severityFilter.has('major')} colorClass="bg-orange-500/15 text-orange-300" onClick={() => onSeverityChange(toggleSet(severityFilter, 'major'))} />
        <Chip label="Minor" count={severityCounts.minor} active={severityFilter.has('minor')} colorClass="bg-blue-500/15 text-blue-300" onClick={() => onSeverityChange(toggleSet(severityFilter, 'minor'))} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Video" count={categoryCounts.video} active={categoryFilter.has('video')} colorClass="bg-purple-500/10 text-purple-400" onClick={() => onCategoryChange(toggleSet(categoryFilter, 'video'))} />
        <Chip label="Web Content" count={categoryCounts.web_content} active={categoryFilter.has('web_content')} colorClass="bg-cyan-500/10 text-cyan-400" onClick={() => onCategoryChange(toggleSet(categoryFilter, 'web_content'))} />
      </div>
    </div>
  );
}
