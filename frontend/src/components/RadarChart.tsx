import { useEffect, useState } from 'react';
import type { Clause } from '../types/report';

interface RadarChartProps {
  clauses: Clause[];
  size?: number;
}

interface CategoryScore {
  label: string;
  shortLabel: string;
  score: number;
  total: number;
  passed: number;
}

function computeCategoryScores(clauses: Clause[]): CategoryScore[] {
  const categories: { prefix: string; label: string; shortLabel: string }[] = [
    { prefix: '7.1', label: 'Captions', shortLabel: 'CAP' },
    { prefix: '7.2', label: 'Audio Description', shortLabel: 'AD' },
    { prefix: '7.3', label: 'Player Controls', shortLabel: 'CTRL' },
    { prefix: '9.1', label: 'Perceivable', shortLabel: 'PER' },
    { prefix: '9.2', label: 'Operable', shortLabel: 'OPR' },
    { prefix: '9.3', label: 'Understandable', shortLabel: 'UND' },
    { prefix: '9.4', label: 'Robust', shortLabel: 'ROB' },
  ];

  return categories
    .map(({ prefix, label, shortLabel }) => {
      const matching = clauses.filter((c) => c.clauseId.startsWith(prefix));
      if (matching.length === 0) return null;
      const passed = matching.filter((c) => c.status === 'pass').length;
      return {
        label,
        shortLabel,
        score: Math.round((passed / matching.length) * 100),
        total: matching.length,
        passed,
      };
    })
    .filter((c): c is CategoryScore => c !== null);
}

export function RadarChart({ clauses, size = 240 }: RadarChartProps) {
  const [animProgress, setAnimProgress] = useState(0);
  const categories = computeCategoryScores(clauses);
  const n = categories.length;

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 36;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function polarToXY(angle: number, r: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1];

  // Build the filled polygon
  const points = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const r = (cat.score / 100) * maxR * animProgress;
    return polarToXY(angle, r);
  });
  const polygonPath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';

  // Color based on average score
  const avgScore = Math.round(categories.reduce((s, c) => s + c.score, 0) / n);
  const fillColor = avgScore >= 80 ? 'rgba(34,197,94,0.2)' : avgScore >= 50 ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)';
  const strokeColor = avgScore >= 80 ? 'rgba(34,197,94,0.8)' : avgScore >= 50 ? 'rgba(234,179,8,0.8)' : 'rgba(239,68,68,0.8)';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Compliance radar chart. ${categories.map((c) => `${c.label}: ${c.score}%`).join(', ')}`}
      >
        <defs>
          <filter id="radar-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid rings */}
        {rings.map((pct) => {
          const r = pct * maxR;
          const ringPoints = Array.from({ length: n }, (_, i) => {
            const angle = startAngle + i * angleStep;
            return polarToXY(angle, r);
          });
          const d = ringPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';
          return (
            <path
              key={pct}
              d={d}
              fill="none"
              className="stroke-slate-300/20 dark:stroke-slate-600/30"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {categories.map((_, i) => {
          const angle = startAngle + i * angleStep;
          const [ex, ey] = polarToXY(angle, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={ex}
              y2={ey}
              className="stroke-slate-300/15 dark:stroke-slate-600/20"
              strokeWidth={1}
            />
          );
        })}

        {/* Filled polygon */}
        <path
          d={polygonPath}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          filter="url(#radar-glow)"
          style={{ transition: 'all 0.3s ease-out' }}
        />

        {/* Data points */}
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={strokeColor}
            className="drop-shadow-sm"
          />
        ))}

        {/* Labels */}
        {categories.map((cat, i) => {
          const angle = startAngle + i * angleStep;
          const labelR = maxR + 20;
          const [lx, ly] = polarToXY(angle, labelR);
          const textAnchor = Math.abs(lx - cx) < 2 ? 'middle' : lx > cx ? 'start' : 'end';
          return (
            <g key={i}>
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[9px] font-medium"
              >
                {cat.shortLabel}
              </text>
              <text
                x={lx}
                y={ly + 11}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[8px] font-mono tabular-nums"
              >
                {Math.round(cat.score * animProgress)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-[260px]">
        {categories.map((cat) => (
          <span key={cat.label} className="text-[10px] text-slate-500 whitespace-nowrap">
            <span className="font-semibold text-slate-400 dark:text-slate-300">{cat.shortLabel}</span> {cat.label}
          </span>
        ))}
      </div>
    </div>
  );
}
