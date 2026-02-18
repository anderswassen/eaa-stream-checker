import type { Finding } from '../types/report';

const config: Record<Finding['severity'], { className: string }> = {
  critical: { className: 'bg-red-200 text-red-900' },
  major: { className: 'bg-orange-200 text-orange-900' },
  minor: { className: 'bg-blue-100 text-blue-800' },
};

export function SeverityBadge({ severity }: { severity: Finding['severity'] }) {
  const { className } = config[severity];
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium uppercase ${className}`}
    >
      {severity}
    </span>
  );
}
