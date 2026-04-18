interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showCount?: boolean;
}

export function ProgressBar({ value, max, label, color = 'bg-brand-500', showCount = true }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      {(label || showCount) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-slate-300">{label}</span>}
          {showCount && <span className="text-slate-400">{value}/{max} ({pct.toFixed(0)}%)</span>}
        </div>
      )}
      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
