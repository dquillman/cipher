import { useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { useCollection, useOrderedCollection } from './useCollection.ts';
import type { ChecklistItem } from '../types/checklist.ts';
import type { BudgetEntry } from '../types/budget.ts';
import type { FunnelEntry } from '../types/funnel.ts';
import type { First100User } from '../types/users.ts';
import type { ABTest } from '../types/abtest.ts';
import type { ContentItem } from '../types/content.ts';
import { calculateMetrics } from '../lib/metricsCalculator.ts';

export function useMarketingData() {
  const { data: checklist, loading: l1 } = useOrderedCollection<ChecklistItem>('marketing_checklist', 'day');
  const { data: budget, loading: l2 } = useOrderedCollection<BudgetEntry>('marketing_budget', 'date');
  const { data: funnel, loading: l3 } = useOrderedCollection<FunnelEntry>('marketing_funnel', 'date');
  const { data: users, loading: l4 } = useCollection<First100User>('marketing_users_first100', orderBy('addedAt', 'desc'));
  const { data: abTests, loading: l5 } = useOrderedCollection<ABTest>('marketing_ab_tests', 'week');
  const { data: content, loading: l6 } = useOrderedCollection<ContentItem>('marketing_content', 'week');

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  const metrics = useMemo(() => calculateMetrics(budget, funnel, users), [budget, funnel, users]);

  return {
    checklist, budget, funnel, users, abTests, content,
    metrics, loading,
  };
}
