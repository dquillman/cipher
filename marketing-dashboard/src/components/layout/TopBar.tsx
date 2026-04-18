import { Rocket, LogOut } from 'lucide-react';
import { AlertBanner } from '../ui/AlertBanner.tsx';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { evaluateRules } from '../../lib/decisionEngine.ts';
import { currentDay, currentWeek } from '../../lib/dateUtils.ts';
import { DEFAULT_CONFIG } from '../../types/config.ts';

interface TopBarProps {
  onLogout: () => void;
}

export function TopBar({ onLogout }: TopBarProps) {
  const { metrics } = useMarketingData();
  const evaluated = evaluateRules(metrics);
  const redAlerts = evaluated
    .filter((r) => r.status === 'red')
    .map((r) => `${r.condition} → ${r.action}`);

  const day = currentDay(DEFAULT_CONFIG.launchDate);
  const week = currentWeek(DEFAULT_CONFIG.launchDate);

  return (
    <header className="bg-slate-800/60 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Rocket className="w-6 h-6 text-brand-400" />
          <div>
            <h1 className="text-lg font-display font-bold text-white">Marketing Command Center</h1>
            <p className="text-xs text-slate-400">Day {day} &middot; Week {week} of launch</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
      {redAlerts.length > 0 && (
        <div className="px-6 pb-3">
          <AlertBanner messages={redAlerts} />
        </div>
      )}
    </header>
  );
}
