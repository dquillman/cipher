import { Outlet, useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getMockEligibility } from '../utils/mockEligibility';

/**
 * Both branches used to redirect, and both were silent dead ends.
 *
 * 'no-diagnostic' went to /app/diagnostics, which is the admin-only System
 * Diagnostics page — it bounces any non-admin straight back to /app. So a
 * tester pressed "Take Full Mock Exam", the URL flickered, and they were on the
 * dashboard again with no message. Pressing it again did the same thing.
 *
 * 'not-pro' redirected to /app with `replace`, which threw away the paywall
 * that exists for exactly this case: no price, no explanation, nothing.
 *
 * A guard that blocks someone has to tell them why and give them the next step.
 * Rendering in place also keeps the URL, so a reload does not lose them.
 */
export default function MockExamGuard() {
  const navigate = useNavigate();
  const { hasCompletedDiagnostic, selectedExamId, examName } = useExam();
  const { isPro, hasPassFor, loading: subLoading } = useSubscription();

  // While diagnostic status is loading, render nothing (parent RequireAuth
  // already handles auth; ExamContext sets null during initial load)
  if (hasCompletedDiagnostic === null) return null;

  // And while the subscription is loading. SubscriptionContext seeds entitlement
  // as free and passEntitlement as null before the Firestore snapshot lands, so
  // if ExamContext resolved first a paying subscriber was shown "The full mock
  // is a Pro feature" until the doc arrived. FreePlanBanner was fixed for this
  // exact flash; the guard was missed.
  if (subLoading) return null;

  // Pass readiness=100 to skip soft-gate — guard only enforces hard gates.
  // Readiness warnings are handled inside SimulatorIntro.
  // Exam Pass unlocks this exam's content the same as Pro.
  const { reason } = getMockEligibility({
    hasCompletedDiagnostic,
    readiness: 100,
    isPro: isPro || hasPassFor(selectedExamId),
  });

  if (!reason) return <Outlet />;

  const blocked =
    reason === 'no-diagnostic'
      ? {
          title: 'Take the diagnostic first',
          body: `Sit the diagnostic first so your results have something to be measured against — it sets your readiness baseline and points your study plan at your weakest domain. It takes about ten minutes for ${examName || 'this exam'}.`,
          cta: 'Start the diagnostic',
          go: () => navigate('/app/quiz', { state: { mode: 'diagnostic' } }),
        }
      : {
          title: 'The full mock is a Pro feature',
          body: 'Practice mode and the diagnostic are free. The full-length timed mock, with the domain breakdown and readiness score afterwards, needs Pro or an Exam Pass.',
          cta: 'See pricing',
          go: () => navigate('/app/pricing'),
        };

  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center px-6 py-16 text-slate-100">
      <div className="max-w-md text-center">
        <h1 className="mb-3 font-display text-2xl font-bold">{blocked.title}</h1>
        <p className="mb-8 leading-relaxed text-slate-400">{blocked.body}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={blocked.go}
            className="rounded-md bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {blocked.cta}
          </button>
          <button
            onClick={() => navigate('/app')}
            className="rounded-md border border-slate-700 px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-900"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
