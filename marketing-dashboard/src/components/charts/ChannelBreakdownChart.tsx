import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { BudgetEntry } from '../../types/budget.ts';
import { CHANNEL_COLORS, CHANNEL_LABELS, type BudgetChannel } from '../../types/budget.ts';
import { formatDate } from '../../lib/dateUtils.ts';

interface Props {
  data: BudgetEntry[];
}

export function ChannelBreakdownChart({ data }: Props) {
  const chartData = data.map((b) => ({
    date: formatDate(b.date),
    googleSearch: b.googleSearch,
    googleRetargeting: b.googleRetargeting,
    metaRetargeting: b.metaRetargeting,
    linkedin: b.linkedin,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No data yet.</p>;
  }

  return (
    <div>
      <h4 className="text-sm font-display font-semibold mb-3">Spend by Channel</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {(Object.keys(CHANNEL_COLORS) as BudgetChannel[]).map((ch) => (
            <Bar key={ch} dataKey={ch} stackId="a" fill={CHANNEL_COLORS[ch]} name={CHANNEL_LABELS[ch]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
