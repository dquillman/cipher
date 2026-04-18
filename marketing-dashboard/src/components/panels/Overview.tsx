import { useNavigate } from 'react-router-dom';
import { CheckSquare, DollarSign, Filter, BarChart3, Brain, Users, FlaskConical, Calendar } from 'lucide-react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { evaluateRules } from '../../lib/decisionEngine.ts';
import { Card } from '../ui/Card.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { MetricCard } from '../ui/MetricCard.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';

export function Overview() {
  const navigate = useNavigate();
  const { checklist, budget, funnel, users, abTests, content, metrics } = useMarketingData();
  const evaluated = evaluateRules(metrics);
  const redCount = evaluated.filter((r) => r.status === 'red').length;
  const completedTasks = checklist.filter((c) => c.completed).length;

  const fmt = (n: number | null, prefix = '$') => n !== null ? `${prefix}${n.toFixed(2)}` : '—';
  const pct = (n: number | null) => n !== null ? `${(n * 100).toFixed(1)}%` : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-bold">Dashboard Overview</h2>

      <DashboardGrid columns={4}>
        <MetricCard label="Total Spend" value={fmt(metrics.totalSpend)} />
        <MetricCard label="Cost / Signup" value={fmt(metrics.costPerSignup)} />
        <MetricCard label="Activation Rate" value={pct(metrics.activationRate)} />
        <MetricCard label="First 100 Users" value={`${metrics.first100Count}/100`} />
      </DashboardGrid>

      <DashboardGrid columns={3}>
        <Card onClick={() => navigate('/checklist')} className="hover:border-brand-500/40">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-semibold text-sm">Launch Checklist</h3>
          </div>
          <ProgressBar value={completedTasks} max={checklist.length} />
        </Card>

        <Card onClick={() => navigate('/budget')}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-accent-400" />
            <h3 className="font-display font-semibold text-sm">Budget</h3>
          </div>
          <p className="text-2xl font-bold font-display">{fmt(metrics.totalSpend)}</p>
          <p className="text-xs text-slate-400 mt-1">{budget.length} days tracked</p>
        </Card>

        <Card onClick={() => navigate('/funnel')}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-sm">Funnel</h3>
          </div>
          <p className="text-2xl font-bold font-display">{metrics.totalSignups}</p>
          <p className="text-xs text-slate-400 mt-1">total signups &middot; {funnel.length} days</p>
        </Card>

        <Card onClick={() => navigate('/metrics')}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-brand-300" />
            <h3 className="font-display font-semibold text-sm">Metrics</h3>
          </div>
          <p className="text-sm text-slate-300">Cost/Trial: {fmt(metrics.costPerTrial)}</p>
          <p className="text-sm text-slate-300">Cost/Activated: {fmt(metrics.costPerActivated)}</p>
        </Card>

        <Card onClick={() => navigate('/decisions')}>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-semibold text-sm">Decision Rules</h3>
          </div>
          <p className="text-sm">
            {redCount > 0 ? (
              <span className="text-red-400">{redCount} alert{redCount > 1 ? 's' : ''} need attention</span>
            ) : (
              <span className="text-emerald-400">All clear</span>
            )}
          </p>
        </Card>

        <Card onClick={() => navigate('/first100')}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="font-display font-semibold text-sm">First 100 Users</h3>
          </div>
          <ProgressBar value={users.length} max={100} color="bg-purple-500" />
        </Card>

        <Card onClick={() => navigate('/ab-tests')}>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-semibold text-sm">A/B Tests</h3>
          </div>
          <p className="text-sm text-slate-300">{abTests.filter((t) => t.status === 'running').length} running &middot; {abTests.filter((t) => t.status === 'complete').length} complete</p>
        </Card>

        <Card onClick={() => navigate('/content')}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-rose-400" />
            <h3 className="font-display font-semibold text-sm">Content Calendar</h3>
          </div>
          <p className="text-sm text-slate-300">{content.filter((c) => c.status === 'published').length} published &middot; {content.filter((c) => c.status === 'draft').length} drafts</p>
        </Card>
      </DashboardGrid>
    </div>
  );
}
