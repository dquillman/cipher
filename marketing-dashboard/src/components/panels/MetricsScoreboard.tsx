import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { evaluateRules } from '../../lib/decisionEngine.ts';
import { MetricCard } from '../ui/MetricCard.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import type { RuleStatus } from '../../lib/decisionEngine.ts';

export function MetricsScoreboard() {
  const { metrics } = useMarketingData();
  const rules = evaluateRules(metrics);

  const getStatus = (ruleId: string): RuleStatus =>
    rules.find((r) => r.id === ruleId)?.status ?? 'no_data';

  const fmt = (n: number | null, prefix = '$') => n !== null ? `${prefix}${n.toFixed(2)}` : '—';
  const pct = (n: number | null) => n !== null ? `${(n * 100).toFixed(1)}%` : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-bold">Metrics Scoreboard</h2>

      <DashboardGrid columns={3}>
        <MetricCard
          label="Cost per Trial"
          value={fmt(metrics.costPerTrial)}
          subtitle="Total spend ÷ trial starts"
        />
        <MetricCard
          label="Cost per Signup"
          value={fmt(metrics.costPerSignup)}
          subtitle="Total spend ÷ signup completes"
          status={getStatus('google_cps')}
        />
        <MetricCard
          label="Cost per Activated User"
          value={fmt(metrics.costPerActivated)}
          subtitle="Total spend ÷ activated users"
        />
        <MetricCard
          label="Activation Rate"
          value={pct(metrics.activationRate)}
          subtitle="Activated ÷ signups"
          status={getStatus('trial_activation')}
        />
        <MetricCard
          label="Explanation View Rate"
          value={pct(metrics.explanationViewRate)}
          subtitle="Explanation views ÷ activated users"
          status={getStatus('explanation_views')}
        />
        <MetricCard
          label="First 100 Activation Rate"
          value={pct(metrics.first100ActivationRate)}
          subtitle="Activated ÷ total manual users"
          status={getStatus('first100_activation')}
        />
      </DashboardGrid>

      <DashboardGrid columns={4}>
        <MetricCard label="Total Spend" value={`$${metrics.totalSpend.toFixed(2)}`} />
        <MetricCard label="Total Trials" value={metrics.totalTrials.toString()} />
        <MetricCard label="Total Signups" value={metrics.totalSignups.toString()} />
        <MetricCard label="Total Activated" value={metrics.totalActivated.toString()} />
      </DashboardGrid>
    </div>
  );
}
