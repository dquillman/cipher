import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { evaluateRules, type RuleStatus } from '../../lib/decisionEngine.ts';
import { Card } from '../ui/Card.tsx';

const DOT_COLORS: Record<RuleStatus, string> = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  no_data: 'bg-slate-500',
};

const STATUS_BG: Record<RuleStatus, string> = {
  green: 'border-emerald-500/20',
  amber: 'border-amber-500/20',
  red: 'border-red-500/20 bg-red-500/5',
  no_data: 'border-slate-700/50',
};

export function DecisionRules() {
  const { metrics } = useMarketingData();
  const rules = evaluateRules(metrics);

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-display font-bold">Decision Rules Engine</h2>
      <p className="text-sm text-slate-400">
        10 rules from the marketing plan. Auto-evaluates from your budget + funnel data.
      </p>

      <div className="space-y-3">
        {rules.map((rule) => {
          const valueStr = rule.currentValue !== null
            ? rule.unit === '%' ? `${(rule.currentValue * 100).toFixed(1)}%`
            : rule.unit === '$' ? `$${rule.currentValue.toFixed(2)}`
            : `${rule.currentValue.toFixed(2)}${rule.unit}`
            : 'No data';

          return (
            <Card key={rule.id} className={`border ${STATUS_BG[rule.status]}`}>
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${DOT_COLORS[rule.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{rule.condition}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-400">
                      Current: <span className="text-slate-200 font-medium">{valueStr}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Threshold: <span className="text-slate-200 font-medium">
                        {rule.unit === '%' ? `${(rule.threshold * 100).toFixed(0)}%`
                        : rule.unit === '$' ? `$${rule.threshold}`
                        : `${rule.threshold}${rule.unit}`}
                      </span>
                    </span>
                  </div>
                  {rule.status === 'red' && (
                    <p className="text-xs text-red-400 mt-2 font-medium">→ {rule.action}</p>
                  )}
                  {rule.status === 'amber' && (
                    <p className="text-xs text-amber-400 mt-2">⚠ Approaching threshold — {rule.action}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
