import type { Clause } from '../types/report';

const config: Record<
  Clause['status'],
  { label: string; className: string; dotClass: string }
> = {
  pass: {
    label: 'Pass',
    className: 'bg-green-500/10 text-green-400 ring-green-500/20',
    dotClass: 'bg-green-400',
  },
  fail: {
    label: 'Fail',
    className: 'bg-red-500/10 text-red-400 ring-red-500/20',
    dotClass: 'bg-red-400',
  },
  needs_review: {
    label: 'Review',
    className: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    dotClass: 'bg-yellow-400',
  },
  not_applicable: {
    label: 'N/A',
    className: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    dotClass: 'bg-slate-500',
  },
};

export function StatusBadge({ status }: { status: Clause['status'] }) {
  const { label, className, dotClass } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
