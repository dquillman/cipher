import { Navigate, Outlet } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getMockEligibility } from '../utils/mockEligibility';

export default function MockExamGuard() {
  const { hasCompletedDiagnostic } = useExam();
  const { isPro } = useSubscription();

  // While diagnostic status is loading, render nothing (parent RequireAuth
  // already handles auth; ExamContext sets null during initial load)
  if (hasCompletedDiagnostic === null) return null;

  // Pass readiness=100 to skip soft-gate — guard only enforces hard gates.
  // Readiness warnings are handled inside SimulatorIntro.
  const { reason } = getMockEligibility({
    hasCompletedDiagnostic,
    readiness: 100,
    isPro,
  });

  if (reason === 'no-diagnostic') return <Navigate to="/app/diagnostics" replace />;
  if (reason === 'not-pro') return <Navigate to="/app" replace />;

  return <Outlet />;
}
