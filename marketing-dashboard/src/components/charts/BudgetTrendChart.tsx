import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { BudgetEntry } from '../../types/budget.ts';
import { formatDate } from '../../lib/dateUtils.ts';

interface Props {
  data: BudgetEntry[];
}

export function BudgetTrendChart({ data }: Props) {
  const chartData = data.map((b) => ({
    date: formatDate(b.date),
    total: b.googleSearch + b.googleRetargeting + b.metaRetargeting + b.linkedin,
    min: 70,
    max: 120,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No budget data yet. Add daily spend to see trends.</p>;
  }

  return (
    <div>
      <h4 className="text-sm font-display font-semibold mb-3">Daily Spend vs Planned Budget</h4>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="max" stroke="none" fill="#6366f1" fillOpacity={0.1} name="Budget Max" />
          <Area type="monotone" dataKey="min" stroke="none" fill="#6366f1" fillOpacity={0.1} name="Budget Min" />
          <Area type="monotone" dataKey="total" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Actual" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
