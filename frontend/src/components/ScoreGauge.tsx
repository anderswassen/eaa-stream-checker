import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

function getScoreColor(score: number): { stroke: string; text: string; glow: string } {
  if (score >= 80) return { stroke: '#22c55e', text: 'text-green-400', glow: 'rgba(34, 197, 94, 0.3)' };
  if (score >= 50) return { stroke: '#eab308', text: 'text-yellow-400', glow: 'rgba(234, 179, 8, 0.3)' };
  return { stroke: '#ef4444', text: 'text-red-400', glow: 'rgba(239, 68, 68, 0.3)' };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Compliant';
  if (score >= 50) return 'Partially Compliant';
  return 'Non-Compliant';
}

export function ScoreGauge({ score, size = 160, label }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;
  const colors = getScoreColor(score);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`Compliance score: ${score}%`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(51, 65, 85, 0.5)"
            strokeWidth={strokeWidth}
          />
          {/* Glow filter */}
          <defs>
            <filter id="score-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            filter="url(#score-glow)"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tabular-nums ${colors.text}`}>
            {animatedScore}
          </span>
          <span className="text-xs text-slate-500 -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${colors.text}`}>
        {label ?? getScoreLabel(score)}
      </span>
    </div>
  );
}
