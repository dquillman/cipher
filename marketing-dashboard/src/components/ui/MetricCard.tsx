import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RuleStatus } from '../../lib/decisionEngine.ts';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  status?: RuleStatus;
  trend?: 'up' | 'down' | 'flat';
}

const STATUS_RING: Record<string, string> = {
  green: 'border-emerald-500/50',
  amber: 'border-amber-500/50',
  red: 'border-red-500/50',
  no_data: 'border-slate-600/50',
};

export function MetricCard({ label, value, subtitle, status = 'no_data', trend }: MetricCardProps) {
  return (
    <div className={`bg-slate-800/60 border-2 rounded-xl p-4 ${STATUS_RING[status]}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-2xl font-bold font-display text-white">{value}</p>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400 mb-1" />}
        {trend === 'flat' && <Minus className="w-4 h-4 text-slate-400 mb-1" />}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
