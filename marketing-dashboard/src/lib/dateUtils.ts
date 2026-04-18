export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

export function currentDay(launchDate: string): number {
  return Math.max(1, daysSince(launchDate) + 1);
}

export function currentWeek(launchDate: string): number {
  return Math.ceil(currentDay(launchDate) / 7);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export function dateRange(startDate: string, days: number): string[] {
  const result: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}
