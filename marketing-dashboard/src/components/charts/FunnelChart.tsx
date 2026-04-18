interface FunnelStage {
  key: string;
  label: string;
  color: string;
  value: number;
}

interface Props {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: Props) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  if (stages.every((s) => s.value === 0)) {
    return <p className="text-sm text-slate-500 py-8 text-center">No funnel data yet. Add daily metrics to see the funnel.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-display font-semibold mb-4">Funnel Visualization</h4>
      {stages.map((stage, i) => {
        const widthPct = Math.max(8, (stage.value / maxValue) * 100);
        const nextValue = stages[i + 1]?.value;
        const convRate = stage.value > 0 && nextValue !== undefined
          ? `${((nextValue / stage.value) * 100).toFixed(1)}%`
          : null;

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div className="w-36 text-right">
              <span className="text-xs text-slate-400">{stage.label}</span>
            </div>
            <div className="flex-1 relative">
              <div
                className="h-8 rounded-md flex items-center justify-end pr-3 transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color,
                  opacity: 0.8,
                  margin: '0 auto',
                }}
              >
                <span className="text-xs font-bold text-white drop-shadow">{stage.value.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-14 text-right">
              {convRate && <span className="text-xs text-slate-400">{convRate}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
