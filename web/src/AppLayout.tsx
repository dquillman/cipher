import { Outlet, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import TrialModal from "./components/TrialModal";
import AppHeader from "./components/layout/AppHeader";
import { useSidebar } from "./contexts/SidebarContext";
import { useSubscription } from "./contexts/SubscriptionContext";
import { useExam } from "./contexts/ExamContext";

/**
 * The signed-in app shell.
 *
 * This lived in App.tsx, which meant Sidebar, AppHeader, TrialModal and their
 * Firestore-backed services were static dependencies of the entry chunk — so a
 * visitor reading the landing page downloaded the whole authenticated UI. It is
 * only ever rendered under /app/*, so it is its own lazy chunk now.
 */
function FreePlanBanner() {
  const { isPro, hasPassFor, questionsAnsweredToday, dailyLimit, loading, profileReady } = useSubscription();
  const { selectedExamId } = useExam();
  // Nothing used to gate on `loading`, so the very first screen after signing up
  // for a 14-day trial carried "Free plan: 0 / 20 questions used today —
  // Upgrade for unlimited practice" until the user doc arrived. Showing a
  // paywall to someone who just started a trial reads as a bait and switch.
  // Render nothing until entitlement is actually known.
  // profileReady covers the seconds after signup when users/{uid} does not
  // exist yet: `loading` is already false there, and the defaults look exactly
  // like a free user who never took a trial.
  if (loading || !profileReady) return null;
  // Exam Pass holders bypass the free-tier quota for their covered exam.
  if (isPro || hasPassFor(selectedExamId)) return null;
  const countColor = questionsAnsweredToday >= dailyLimit
    ? 'text-red-400'
    : questionsAnsweredToday >= dailyLimit - 2
      ? 'text-amber-400'
      : 'text-white';
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
      <span>Free plan: <span className={`font-semibold ${countColor}`}>{questionsAnsweredToday} / {dailyLimit}</span> questions used today</span>
      <Link to="/app/pricing" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
        Upgrade for unlimited practice
      </Link>
    </div>
  );
}

function AppLayout() {
  const { isCollapsed } = useSidebar();
  return (
    <div className="decoder min-h-dvh bg-slate-900 text-slate-100 flex relative overflow-x-hidden">
      <TrialModal />
      <Sidebar />
      <MobileNav />
      {/* min-w-0: a flex child defaults to min-width:auto, so it refuses to
          shrink below its content's min-content width. One non-wrapping row
          inside the quiz explanation was enough to push this column to 507px
          inside a 393px phone viewport — and because .decoder clips overflow-x,
          the header (exam name, Q/N counter, theme toggle) was simply gone,
          with no scroll to reach it. */}
      <div className={`flex-1 min-w-0 ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} flex flex-col pb-20 md:pb-0 transition-all duration-300`}>
        <AppHeader />
        <FreePlanBanner />
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
