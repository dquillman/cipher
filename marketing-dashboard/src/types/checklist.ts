export interface ChecklistItem {
  id: string;
  day: number;
  week: number;
  task: string;
  benefit: string;
  steps: string[];
  expectedOutcome: string;
  completed: boolean;
  completedAt: string | null;
}
