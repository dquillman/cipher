import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm ${onClick ? 'cursor-pointer hover:border-brand-500/40 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
