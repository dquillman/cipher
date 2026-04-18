import type { ReactNode } from 'react';

interface DashboardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function DashboardGrid({ children, columns = 2 }: DashboardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  };
  return (
    <div className={`grid gap-5 ${gridCols[columns]}`}>
      {children}
    </div>
  );
}
