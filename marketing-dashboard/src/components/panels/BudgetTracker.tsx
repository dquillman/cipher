import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { saveBudgetEntry } from '../../services/budgetService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import { BudgetTrendChart } from '../charts/BudgetTrendChart.tsx';
import { ChannelBreakdownChart } from '../charts/ChannelBreakdownChart.tsx';
import { CHANNEL_LABELS, type BudgetChannel } from '../../types/budget.ts';
import { today, formatDate } from '../../lib/dateUtils.ts';

export function BudgetTracker() {
  const { budget, metrics } = useMarketingData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    googleSearch: 0,
    googleRetargeting: 0,
    metaRetargeting: 0,
    linkedin: 0,
    notes: '',
  });

  const handleSave = async () => {
    await saveBudgetEntry(form);
    setModalOpen(false);
    setForm({ date: today(), googleSearch: 0, googleRetargeting: 0, metaRetargeting: 0, linkedin: 0, notes: '' });
  };

  const channelTotals: Record<BudgetChannel, number> = {
    googleSearch: budget.reduce((s, b) => s + b.googleSearch, 0),
    googleRetargeting: budget.reduce((s, b) => s + b.googleRetargeting, 0),
    metaRetargeting: budget.reduce((s, b) => s + b.metaRetargeting, 0),
    linkedin: budget.reduce((s, b) => s + b.linkedin, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Budget Tracker</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Daily Spend
        </button>
      </div>

      <DashboardGrid columns={4}>
        <Card>
          <p className="text-xs text-slate-400 uppercase">Total Spend</p>
          <p className="text-2xl font-bold font-display mt-1">${metrics.totalSpend.toFixed(2)}</p>
        </Card>
        {(Object.keys(channelTotals) as BudgetChannel[]).map((ch) => (
          <Card key={ch}>
            <p className="text-xs text-slate-400 uppercase">{CHANNEL_LABELS[ch]}</p>
            <p className="text-xl font-bold font-display mt-1">${channelTotals[ch].toFixed(2)}</p>
          </Card>
        ))}
      </DashboardGrid>

      <DashboardGrid>
        <Card><BudgetTrendChart data={budget} /></Card>
        <Card><ChannelBreakdownChart data={budget} /></Card>
      </DashboardGrid>

      {/* Recent entries table */}
      <Card>
        <h3 className="font-display font-semibold mb-3">Recent Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Google Search</th>
                <th className="pb-2 pr-4">Google Retargeting</th>
                <th className="pb-2 pr-4">Meta</th>
                <th className="pb-2 pr-4">LinkedIn</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...budget].reverse().slice(0, 10).map((b) => (
                <tr key={b.date} className="border-b border-slate-700/50">
                  <td className="py-2 pr-4 text-slate-300">{formatDate(b.date)}</td>
                  <td className="py-2 pr-4">${b.googleSearch.toFixed(2)}</td>
                  <td className="py-2 pr-4">${b.googleRetargeting.toFixed(2)}</td>
                  <td className="py-2 pr-4">${b.metaRetargeting.toFixed(2)}</td>
                  <td className="py-2 pr-4">${b.linkedin.toFixed(2)}</td>
                  <td className="py-2 font-medium">${(b.googleSearch + b.googleRetargeting + b.metaRetargeting + b.linkedin).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DataEntryModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Daily Spend">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {(Object.keys(CHANNEL_LABELS) as BudgetChannel[]).map((ch) => (
            <div key={ch}>
              <label className="block text-sm text-slate-300 mb-1">{CHANNEL_LABELS[ch]} ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form[ch]}
                onChange={(e) => setForm({ ...form, [ch]: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
          >
            Save Entry
          </button>
        </div>
      </DataEntryModal>
    </div>
  );
}
