interface Props {
  value: number;
  max: number;
  label: string;
}

export function ProgressDonut({ value, max, label }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="#334155" strokeWidth="10" />
        <circle
          cx="75" cy="75" r={radius}
          fill="none"
          stroke={pct >= 100 ? '#10b981' : '#6366f1'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 75 75)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="75" y="68" textAnchor="middle" className="fill-white text-2xl font-bold" style={{ fontSize: 28, fontWeight: 700 }}>
          {value}
        </text>
        <text x="75" y="90" textAnchor="middle" className="fill-slate-400 text-xs" style={{ fontSize: 12 }}>
          / {max}
        </text>
      </svg>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}
