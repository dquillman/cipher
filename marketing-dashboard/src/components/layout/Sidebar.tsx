import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, DollarSign, Filter,
  BarChart3, Brain, Users, FlaskConical, Calendar,
  Linkedin, MessageCircle,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/checklist', icon: CheckSquare, label: 'Checklist' },
  { to: '/budget', icon: DollarSign, label: 'Budget' },
  { to: '/funnel', icon: Filter, label: 'Funnel' },
  { to: '/metrics', icon: BarChart3, label: 'Metrics' },
  { to: '/decisions', icon: Brain, label: 'Decisions' },
  { to: '/first100', icon: Users, label: 'First 100' },
  { to: '/ab-tests', icon: FlaskConical, label: 'A/B Tests' },
  { to: '/content', icon: Calendar, label: 'Content' },
  { to: '/linkedin', icon: Linkedin, label: 'LinkedIn' },
  { to: '/reddit', icon: MessageCircle, label: 'Reddit' },
] as const;

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-slate-800/40 border-r border-slate-700/50 flex flex-col py-4">
      <nav className="flex-1 space-y-1 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
