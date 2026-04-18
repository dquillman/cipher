import { useEffect } from 'react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { seedABTests, updateABTest } from '../../services/abTestService.ts';
import { Card } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';

const STATUS_VARIANT = {
  planned: 'blue' as const,
  running: 'amber' as const,
  complete: 'green' as const,
};

export function ABTestingPanel() {
  const { abTests } = useMarketingData();

  useEffect(() => { seedABTests(); }, []);

  const handleStatusChange = async (id: string, status: 'planned' | 'running' | 'complete') => {
    const updates: Record<string, unknown> = { status };
    if (status === 'running') updates.startDate = new Date().toISOString().slice(0, 10);
    if (status === 'complete') updates.endDate = new Date().toISOString().slice(0, 10);
    await updateABTest(id, updates);
  };

  const handleDeclareWinner = async (id: string, winner: 'A' | 'B') => {
    await updateABTest(id, { winner, status: 'complete', endDate: new Date().toISOString().slice(0, 10) });
  };

  const handleMetricChange = async (id: string, variant: 'A' | 'B', value: string) => {
    const field = variant === 'A' ? 'metricA' : 'metricB';
    await updateABTest(id, { [field]: parseFloat(value) || null });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-display font-bold">A/B Testing Calendar</h2>
      <p className="text-sm text-slate-400">One test per week. Test ONE variable at a time.</p>

      <div className="space-y-4">
        {abTests.map((test) => (
          <Card key={test.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-sm">{test.name}</h3>
                  <StatusBadge variant={STATUS_VARIANT[test.status]}>{test.status}</StatusBadge>
                  {test.winner && <StatusBadge variant="green">Winner: {test.winner}</StatusBadge>}
                </div>
                <p className="text-xs text-slate-400 mt-1">Week {test.week} &middot; {test.description}</p>
              </div>
              <div className="flex gap-1">
                {test.status === 'planned' && (
                  <button
                    onClick={() => handleStatusChange(test.id, 'running')}
                    className="text-xs px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-md hover:bg-amber-500/30"
                  >
                    Start
                  </button>
                )}
                {test.status === 'running' && (
                  <button
                    onClick={() => handleStatusChange(test.id, 'complete')}
                    className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/30"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className={`p-3 rounded-lg border ${test.winner === 'A' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700'}`}>
                <p className="text-xs text-slate-400 mb-1">Variant A</p>
                <p className="text-sm text-slate-200">{test.variantA}</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    step={0.01}
                    placeholder="Metric"
                    value={test.metricA ?? ''}
                    onChange={(e) => handleMetricChange(test.id, 'A', e.target.value)}
                    className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                  />
                  {test.status === 'running' && !test.winner && (
                    <button
                      onClick={() => handleDeclareWinner(test.id, 'A')}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Winner
                    </button>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${test.winner === 'B' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700'}`}>
                <p className="text-xs text-slate-400 mb-1">Variant B</p>
                <p className="text-sm text-slate-200">{test.variantB}</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    step={0.01}
                    placeholder="Metric"
                    value={test.metricB ?? ''}
                    onChange={(e) => handleMetricChange(test.id, 'B', e.target.value)}
                    className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                  />
                  {test.status === 'running' && !test.winner && (
                    <button
                      onClick={() => handleDeclareWinner(test.id, 'B')}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Winner
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
