import { Navigate, Outlet } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getMockEligibility } from '../utils/mockEligibility';

export default function MockExamGuard() {
  const { hasCompletedDiagnostic, selectedExamId } = useExam();
  const { isPro, hasPassFor } = useSubscription();

  // While diagnostic status is loading, render nothing (parent RequireAuth
  // already handles auth; ExamContext sets null during initial load)
  if (hasCompletedDiagnostic === null) return null;

  // Pass readiness=100 to skip soft-gate — guard only enforces hard gates.
  // Readiness warnings are handled inside SimulatorIntro.
  // Exam Pass unlocks this exam's content the same as Pro.
  const { reason } = getMockEligibility({
    hasCompletedDiagnostic,
    readiness: 100,
    isPro: isPro || hasPassFor(selectedExamId),
  });

  if (reason === 'no-diagnostic') return <Navigate to="/app/diagnostics" replace />;
  if (reason === 'not-pro') return <Navigate to="/app" replace />;

  return <Outlet />;
}
