import type { Finding } from '../types/report';

const config: Record<Finding['severity'], { className: string; mutedClassName: string }> = {
  critical: {
    className: 'bg-red-500/15 text-red-300 ring-red-500/20',
    mutedClassName: 'bg-transparent text-slate-500 ring-slate-600/30 border-dashed',
  },
  major: {
    className: 'bg-orange-500/15 text-orange-300 ring-orange-500/20',
    mutedClassName: 'bg-transparent text-slate-500 ring-slate-600/30 border-dashed',
  },
  minor: {
    className: 'bg-blue-500/15 text-blue-300 ring-blue-500/20',
    mutedClassName: 'bg-transparent text-slate-500 ring-slate-600/30 border-dashed',
  },
};

export function SeverityBadge({ severity, muted }: { severity: Finding['severity']; muted?: boolean }) {
  const { className, mutedClassName } = config[severity];
  return (
    <span
      className={`shrink-0 rounded-md ring-1 ring-inset px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${muted ? mutedClassName : className}`}
      title={muted ? `Potential severity if non-compliant: ${severity}` : undefined}
    >
      {muted ? `${severity} if failed` : severity}
    </span>
  );
}
