import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.ts';
import { Shell } from './components/layout/Shell.tsx';
import { Overview } from './components/panels/Overview.tsx';
import { LaunchChecklist } from './components/panels/LaunchChecklist.tsx';
import { BudgetTracker } from './components/panels/BudgetTracker.tsx';
import { FunnelDashboard } from './components/panels/FunnelDashboard.tsx';
import { MetricsScoreboard } from './components/panels/MetricsScoreboard.tsx';
import { DecisionRules } from './components/panels/DecisionRules.tsx';
import { First100Users } from './components/panels/First100Users.tsx';
import { ABTestingPanel } from './components/panels/ABTestingPanel.tsx';
import { ContentCalendar } from './components/panels/ContentCalendar.tsx';
import { LinkedInOutreach } from './components/panels/LinkedInOutreach.tsx';
import { RedditTracker } from './components/panels/RedditTracker.tsx';

export default function App() {
  const { user, loading, authorized, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display font-bold">Marketing Command Center</h1>
          <p className="text-slate-400">Sign in to access the dashboard</p>
          <button
            onClick={login}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-red-400">Access Denied</h1>
          <p className="text-slate-400">This dashboard is restricted.</p>
          <button onClick={logout} className="text-sm text-brand-400 hover:underline">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Shell onLogout={logout} />}>
        <Route index element={<Overview />} />
        <Route path="checklist" element={<LaunchChecklist />} />
        <Route path="budget" element={<BudgetTracker />} />
        <Route path="funnel" element={<FunnelDashboard />} />
        <Route path="metrics" element={<MetricsScoreboard />} />
        <Route path="decisions" element={<DecisionRules />} />
        <Route path="first100" element={<First100Users />} />
        <Route path="ab-tests" element={<ABTestingPanel />} />
        <Route path="content" element={<ContentCalendar />} />
        <Route path="linkedin" element={<LinkedInOutreach />} />
        <Route path="reddit" element={<RedditTracker />} />
      </Route>
    </Routes>
  );
}
