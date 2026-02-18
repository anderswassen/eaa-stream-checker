import type { Finding } from '../types/report';

const config: Record<Finding['severity'], { className: string }> = {
  critical: { className: 'bg-red-500/15 text-red-300 ring-red-500/20' },
  major: { className: 'bg-orange-500/15 text-orange-300 ring-orange-500/20' },
  minor: { className: 'bg-blue-500/15 text-blue-300 ring-blue-500/20' },
};

export function SeverityBadge({ severity }: { severity: Finding['severity'] }) {
  const { className } = config[severity];
  return (
    <span
      className={`shrink-0 rounded-md ring-1 ring-inset px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {severity}
    </span>
  );
}
