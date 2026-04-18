export interface ABTest {
  id: string;
  week: number;
  name: string;
  description: string;
  status: 'planned' | 'running' | 'complete';
  variantA: string;
  variantB: string;
  metricA: number | null;
  metricB: number | null;
  winner: 'A' | 'B' | null;
  startDate: string | null;
  endDate: string | null;
}
