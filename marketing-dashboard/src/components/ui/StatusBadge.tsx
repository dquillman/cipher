const VARIANTS = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gray: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
} as const;

interface StatusBadgeProps {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
