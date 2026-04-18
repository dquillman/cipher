import type { CalculatedMetrics } from './metricsCalculator.ts';
import { decisionRules, type DecisionRule } from '../data/decisionRules.ts';

export type RuleStatus = 'green' | 'amber' | 'red' | 'no_data';

export interface EvaluatedRule extends DecisionRule {
  status: RuleStatus;
  currentValue: number | null;
}

export function evaluateRules(metrics: CalculatedMetrics): EvaluatedRule[] {
  return decisionRules.map((rule) => {
    const currentValue = rule.getValue(metrics);
    if (currentValue === null) {
      return { ...rule, status: 'no_data' as RuleStatus, currentValue };
    }
    const status: RuleStatus = rule.evaluate(currentValue) ? 'red' :
      rule.evaluateAmber?.(currentValue) ? 'amber' : 'green';
    return { ...rule, status, currentValue };
  });
}

export function hasRedAlerts(metrics: CalculatedMetrics): boolean {
  return evaluateRules(metrics).some((r) => r.status === 'red');
}
