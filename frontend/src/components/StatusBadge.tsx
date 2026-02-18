import type { Clause } from '../types/report';

const config: Record<
  Clause['status'],
  { label: string; icon: string; className: string }
> = {
  pass: {
    label: 'Pass',
    icon: '\u2713',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  fail: {
    label: 'Fail',
    icon: '\u2717',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  needs_review: {
    label: 'Needs Review',
    icon: '?',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  not_applicable: {
    label: 'N/A',
    icon: '\u2014',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

export function StatusBadge({ status }: { status: Clause['status'] }) {
  const { label, icon, className } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
