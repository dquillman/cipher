import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { saveFunnelEntry } from '../../services/funnelService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { FunnelChart } from '../charts/FunnelChart.tsx';
import { FUNNEL_STAGES, type FunnelStageKey } from '../../types/funnel.ts';
import { today } from '../../lib/dateUtils.ts';

const EMPTY_FUNNEL: Record<FunnelStageKey, number> = {
  landingPageViews: 0, pricingViews: 0, ctaClicks: 0, trialStarts: 0,
  signupCompletes: 0, examSelections: 0, activatedUsers: 0, explanationViews: 0,
};

export function FunnelDashboard() {
  const { funnel } = useMarketingData();
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [form, setForm] = useState<Record<FunnelStageKey, number>>({ ...EMPTY_FUNNEL });
  const [view, setView] = useState<'today' | 'week' | 'all'>('all');

  const filtered = view === 'all' ? funnel :
    view === 'today' ? funnel.filter((f) => f.date === today()) :
    funnel.filter((f) => {
      const d = new Date(f.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
      return d >= weekAgo;
    });

  const totals = FUNNEL_STAGES.map(({ key, label, color }) => ({
    key, label, color,
    value: filtered.reduce((s, f) => s + (f[key] as number), 0),
  }));

  const handleSave = async () => {
    await saveFunnelEntry({ date, ...form });
    setModalOpen(false);
    setForm({ ...EMPTY_FUNNEL });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Funnel Dashboard</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            {(['today', 'week', 'all'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {v === 'today' ? 'Today' : v === 'week' ? 'This Week' : 'All Time'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Funnel Data
          </button>
        </div>
      </div>

      <Card>
        <FunnelChart stages={totals} />
      </Card>

      {/* Conversion rates */}
      <Card>
        <h3 className="font-display font-semibold mb-3">Stage-to-Stage Conversion Rates</h3>
        <div className="space-y-2">
          {totals.slice(0, -1).map((stage, i) => {
            const next = totals[i + 1];
            const rate = stage.value > 0 ? ((next.value / stage.value) * 100).toFixed(1) : '—';
            return (
              <div key={stage.key} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{stage.label} → {next.label}</span>
                <span className="text-slate-200 font-medium">{rate}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      <DataEntryModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Funnel Data">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {FUNNEL_STAGES.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1">{label}</label>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
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
