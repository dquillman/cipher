import { Routes, Route, Navigate, Outlet, useLocation, Link } from "react-router-dom";
import React, { useEffect, useState, createContext, useContext, Suspense, type ReactNode } from "react";
import { lazyWithReload as lazy, isDeployChunkError } from "./utils/lazyWithReload";
import { onAuthStateChanged, type User, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { APP_VERSION } from "./version";
import { isValidVersion, evaluateVersion } from "./utils/versionCheck";
// Not lazy: this must mount before the gates below it, so it cannot wait on a chunk.
import RouteAnalytics from "./lib/RouteAnalytics";
// Pages (lazy-loaded for code splitting)
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MarketingCommandCenter = lazy(() => import("./pages/MarketingCommandCenter"));
const Login = lazy(() => import("./pages/Login"));
const ExamList = lazy(() => import("./pages/ExamList"));
const Quiz = lazy(() => import("./pages/Quiz"));
// Dev-only harness for the Daylight study-mode skin (route gated by DEV below)
const DaylightPreview = lazy(() => import("./pages/DaylightPreview"));
const About = lazy(() => import("./pages/About"));
const Story = lazy(() => import("./pages/Story"));
const PublicPricing = lazy(() => import("./pages/PublicPricing"));
const EventVerifier = lazy(() => import("./pages/EventVerifier"));
const Blog = lazy(() => import("./pages/Blog"));
const WhyCertExamsConfusing = lazy(() => import("./pages/articles/WhyCertExamsConfusing"));
const FiveStudyMistakes = lazy(() => import("./pages/articles/FiveStudyMistakes"));
const HowAIExplanationsWork = lazy(() => import("./pages/articles/HowAIExplanationsWork"));
const FirstThirtyDays = lazy(() => import("./pages/articles/FirstThirtyDays"));
const StudyByBloomsLevel = lazy(() => import("./pages/articles/StudyByBloomsLevel"));
const RecallOnlyPrepFails = lazy(() => import("./pages/articles/RecallOnlyPrepFails"));
const CognitiveHeatmap = lazy(() => import("./pages/articles/CognitiveHeatmap"));
const HowExamsThink = lazy(() => import("./pages/articles/HowExamsThink"));
const PmpExamChangesJuly2026 = lazy(() => import("./pages/articles/PmpExamChangesJuly2026"));
const ExamLensGlossary = lazy(() => import("./pages/ExamLensGlossary"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Tier 1 ad landing pages (added 2026-05-11 via dquillman/cipher-marketing campaign)
const PmpPracticeLP = lazy(() => import("./pages/landing/PmpPracticeLP"));
const SecurityPlusPracticeLP = lazy(() => import("./pages/landing/SecurityPlusPracticeLP"));
const ShrmCpPracticeLP = lazy(() => import("./pages/landing/ShrmCpPracticeLP"));
// Additional cert LPs (added 2026-06-13 — one per live exam, linked from the home Exam Coverage grid)
const CsmPracticeLP = lazy(() => import("./pages/landing/CsmPracticeLP"));
const Itil4PracticeLP = lazy(() => import("./pages/landing/Itil4PracticeLP"));
const NetworkPlusPracticeLP = lazy(() => import("./pages/landing/NetworkPlusPracticeLP"));
const APlusCore2PracticeLP = lazy(() => import("./pages/landing/APlusCore2PracticeLP"));
const SixSigmaPracticeLP = lazy(() => import("./pages/landing/SixSigmaPracticeLP"));
const PgmpPracticeLP = lazy(() => import("./pages/landing/PgmpPracticeLP"));
const CiaPart1PracticeLP = lazy(() => import("./pages/landing/CiaPart1PracticeLP"));
// Comparison / alternative SEO pages (added 2026-07-16)
const PocketPrepAlternative = lazy(() => import("./pages/compare/PocketPrepAlternative"));
const BestPmpSimulator2026 = lazy(() => import("./pages/compare/BestPmpSimulator2026"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Help = lazy(() => import("./pages/Help"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Success = lazy(() => import("./pages/Success"));
const Account = lazy(() => import("./pages/Account"));
const SimulatorIntro = lazy(() => import("./pages/SimulatorIntro"));
const Simulator = lazy(() => import("./pages/Simulator"));
const SimulatorResults = lazy(() => import("./pages/SimulatorResults"));
const Stats = lazy(() => import("./pages/Stats"));
const SetupPlanner = lazy(() => import("./pages/planner/SetupPlanner"));
const StudySchedule = lazy(() => import("./pages/planner/StudySchedule"));
const VerbalMode = lazy(() => import("./pages/VerbalMode"));
const ReadinessReportPage = lazy(() => import("./pages/ReadinessReport"));
const DiagnosticsPage = lazy(() => import("./pages/DiagnosticsPage"));
const Faq = lazy(() => import("./pages/Faq"));
const StartHere = lazy(() => import("./pages/StartHere"));
import TestimonialPromptHost from "./components/TestimonialPromptHost";

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

import { useSessionTracker } from "./hooks/useSessionTracker";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { closeSession } = useSessionTracker(user);

  useEffect(() => {
    // Safety check for auth initialization failure
    if (!auth) {
      console.error("Firebase Auth not initialized correctly.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await closeSession();
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still sign out if session close fails
      await signOut(auth);
    }
  };

  if (!auth && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8 bg-slate-800 rounded-xl border border-red-500/30">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Configuration Error</h1>
          <p className="text-slate-300">Firebase failed to initialize. Please check your network connection or configuration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Version Enforcement ---
// State machine: loading → (ok | warn | block)
// 'loading' — Firestore check in progress; children not rendered
// 'ok'      — current or ahead of latest; normal rendering
// 'warn'    — behind latest but at or above minimum; non-blocking banner
// 'block'   — below minimum; full-screen block, children not rendered
type VersionStatus = 'loading' | 'ok' | 'warn' | 'block';

function VersionGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VersionStatus>('loading');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_config', 'version'));

        if (cancelled) return;

        if (!snap.exists()) {
          setStatus('ok');
          return;
        }

        const data = snap.data();
        const remoteLatest: string | undefined = data?.latest;
        const remoteMinimum: string | undefined = data?.minimum;

        if (!remoteLatest || !isValidVersion(remoteLatest)) {
          console.warn(`VersionGate: invalid or missing latest version "${remoteLatest}" — failing open`);
          setStatus('ok');
          return;
        }

        let validMinimum: string | undefined;
        if (remoteMinimum) {
          if (isValidVersion(remoteMinimum)) {
            validMinimum = remoteMinimum;
          } else {
            console.warn(`VersionGate: invalid minimum version "${remoteMinimum}" — defaulting to latest`);
          }
        }

        const result = evaluateVersion(APP_VERSION, remoteLatest, validMinimum);
        setStatus(result);
      } catch {
        if (cancelled) return;
        // Network, permissions, or parse error — fail-open
        setStatus('ok');
      }
    };

    check();

    return () => { cancelled = true; };
  }, []);

  switch (status) {
    case 'loading':
      // Render the app while the version check is still in flight, rather than
      // holding a spinner in front of everything.
      //
      // This gate sits outermost, and nothing below it — AuthProvider,
      // ExamProvider, SubscriptionProvider, the route itself — could even begin
      // its own round trip until this one came back. v1.25.6 instrumentation
      // measured the result: of a 4.3-7.5s wait to see a quiz question, only
      // 1.2-1.7s was the quiz loading its data. The other 2.7-6.2s (62-83%) was
      // this serial chain of gates, and this is the first link in it.
      //
      // Blocking bought very little in the first place: every failure path here
      // already falls through to 'ok', so a user whose check errors or times
      // out has always been let straight in. The only behaviour given up is
      // that someone on a below-minimum version now sees the app for the few
      // hundred ms before 'block' lands, instead of a spinner. 'block' still
      // takes over the whole screen the moment it resolves.
      return <>{children}</>;
    case 'block':
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-md shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-3">Update required</h1>
            <p className="text-slate-400 mb-6 leading-relaxed">
              A new version of CipherExam is available.<br />
              Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              Refresh Now
            </button>
          </div>
        </div>
      );
    case 'warn':
      return (
        <>
          {!dismissed && (
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600/95 text-white text-sm text-center py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg">
              <span>A newer version of CipherExam is available. Refresh for the latest features.</span>
              <button
                onClick={() => window.location.reload()}
                className="underline font-medium hover:text-white/90"
              >
                Refresh
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/70 hover:text-white ml-2"
                aria-label="Dismiss"
              >
                &#x2715;
              </button>
            </div>
          )}
          {children}
        </>
      );
    case 'ok':
      return <>{children}</>;
  }
}

// --- Route Guards ---
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function PublicOnly() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}

import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import MockExamGuard from "./components/MockExamGuard";

import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { SubscriptionProvider, useSubscription } from "./contexts/SubscriptionContext";

import TrialModal from "./components/TrialModal";

// --- Layouts ---
import AppHeader from "./components/layout/AppHeader";

function FreePlanBanner() {
  const { isPro, hasPassFor, questionsAnsweredToday, dailyLimit } = useSubscription();
  const { selectedExamId } = useExam();
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
    <div className="decoder min-h-screen bg-slate-900 text-slate-100 flex relative overflow-x-hidden">
      <TrialModal />
      <Sidebar />
      <MobileNav />
      <div className={`flex-1 ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} flex flex-col pb-20 md:pb-0 transition-all duration-300`}>
        <AppHeader />
        <FreePlanBanner />
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { ExamProvider, useExam } from "./contexts/ExamContext";
import { SmartQuizReviewProvider, useSmartQuizReview } from "./contexts/SmartQuizReviewContext";
import SmartQuizReviewModal from "./components/SmartQuizReviewModal";

// --- Analytics Hook ---
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

function useAnalytics() {
  useEffect(() => {
    const trackVisit = async () => {
      // Basic unique session tracking
      if (sessionStorage.getItem('visited_session')) return;

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const source = searchParams.get('utm_source') || 'direct'; // Default to direct

        // Log to backend
        const logVisitor = httpsCallable(functions, 'logVisitorEvent');
        await logVisitor({ source, path: window.location.pathname });

        // Mark session as tracked
        sessionStorage.setItem('visited_session', 'true');
        console.log('Analytics: Visit logged from', source);
      } catch (error) {
        console.error('Analytics: Failed to log visit', error);
      }
    };

    trackVisit();
  }, []);
}

function GlobalSmartQuizReviewModal() {
  const { state, closeReview } = useSmartQuizReview();
  return (
    <SmartQuizReviewModal
      open={state.open}
      onClose={closeReview}
      reviewText={state.reviewText}
      loading={state.loading}
      isPartial={state.isPartial}
      isPro={state.isPro}
    />
  );
}

class AppErrorBoundary extends React.Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      // Stale chunk after a deploy: don't scare the user with a red stack —
      // it's just a new version. (lazyWithReload already auto-reloads once;
      // this is the fallback if the reload cooldown is still active.)
      if (isDeployChunkError(this.state.error)) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-8">
            <div className="max-w-md text-center">
              <h1 className="text-2xl font-bold text-white mb-3 font-display">A new version is available</h1>
              <p className="text-slate-400 mb-6">CipherExam was just updated. Reload to get the latest — your progress is saved.</p>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold transition-colors">Reload</button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-8">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <pre className="text-left text-sm text-slate-300 bg-slate-800 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-brand-600 rounded-lg font-bold">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Resets scroll to the top on every route (pathname) change. SPA navigation
 * otherwise keeps the previous page's scroll position — so opening an LP from a
 * card halfway down the home page would land mid-LP. Skips when the URL carries
 * a hash so in-page anchor links (e.g. /#testimonial) still scroll to target.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

function App() {
  useAnalytics(); // Initialize Analytics

  return (
    <AppErrorBoundary>
    {/* Above VersionGate and AuthProvider on purpose — both block rendering on a
        network round-trip, and analytics mounted below them only reaches GA4 for
        visitors who wait that out. See src/lib/RouteAnalytics.tsx. */}
    <RouteAnalytics />
    <VersionGate>
    <AuthProvider>
      <SidebarProvider>
        <ExamProvider>
          <SubscriptionProvider>
            <SmartQuizReviewProvider>
            <Suspense fallback={
              <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
              </div>
            }>
            <ScrollToTop />
            <Routes>
              {/* Public Routes (Accessible to everyone) */}
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/story" element={<Story />} />
              <Route path="/pricing" element={<PublicPricing />} />
              <Route path="/verify-events" element={<EventVerifier />} />
              {import.meta.env.DEV && <Route path="/dev/daylight" element={<DaylightPreview />} />}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/why-certification-exam-questions-are-so-confusing" element={<WhyCertExamsConfusing />} />
              <Route path="/blog/5-study-mistakes-that-cost-your-certification-exam" element={<FiveStudyMistakes />} />
              <Route path="/blog/how-ai-explanations-change-the-way-you-study" element={<HowAIExplanationsWork />} />
              <Route path="/blog/first-30-days-certification-study-plan" element={<FirstThirtyDays />} />
              <Route path="/blog/study-by-blooms-level" element={<StudyByBloomsLevel />} />
              <Route path="/blog/recall-only-prep-fails" element={<RecallOnlyPrepFails />} />
              <Route path="/blog/cognitive-heatmap" element={<CognitiveHeatmap />} />
              <Route path="/blog/how-certification-exams-think" element={<HowExamsThink />} />
              <Route path="/blog/pmp-exam-changes-july-2026" element={<PmpExamChangesJuly2026 />} />
              <Route path="/exam-lens" element={<ExamLensGlossary />} />
              {/* Tier 1 ad landing pages — see dquillman/cipher-marketing for campaign context */}
              <Route path="/lp/pmp" element={<PmpPracticeLP />} />
              <Route path="/lp/security-plus" element={<SecurityPlusPracticeLP />} />
              <Route path="/lp/shrm-cp" element={<ShrmCpPracticeLP />} />
              <Route path="/lp/csm" element={<CsmPracticeLP />} />
              <Route path="/lp/itil" element={<Itil4PracticeLP />} />
              <Route path="/lp/network-plus" element={<NetworkPlusPracticeLP />} />
              <Route path="/lp/a-plus-core-2" element={<APlusCore2PracticeLP />} />
              <Route path="/lp/six-sigma" element={<SixSigmaPracticeLP />} />
              <Route path="/lp/pgmp" element={<PgmpPracticeLP />} />
              <Route path="/lp/cia" element={<CiaPart1PracticeLP />} />
              {/* Comparison / alternative SEO pages */}
              <Route path="/compare/pocketprep-alternative" element={<PocketPrepAlternative />} />
              <Route path="/compare/best-pmp-exam-simulator-2026" element={<BestPmpSimulator2026 />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/signin" element={<Navigate to="/login" replace />} />

              {/* Auth Routes (Only for logged out users) */}
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected Routes (Accessible only when logged in) */}
              <Route path="/app/*" element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="exams" element={<ExamList />} />
                  <Route path="quiz" element={<Quiz />} />
                  <Route path="quiz/:examId" element={<Quiz />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="account" element={<Account />} />
                  <Route path="success" element={<Success />} />
                  <Route path="help" element={<Help />} />
                  <Route element={<MockExamGuard />}>
                    <Route path="simulator" element={<SimulatorIntro />} />
                    <Route path="simulator/exam" element={<Simulator />} />
                    <Route path="simulator/results" element={<SimulatorResults />} />
                  </Route>
                  <Route path="stats" element={<Stats />} />
                  <Route path="planner" element={<StudySchedule />} />
                  <Route path="planner/setup" element={<SetupPlanner />} />
                  <Route path="verbal" element={<VerbalMode />} />
                  <Route path="readiness" element={<ReadinessReportPage />} />
                  <Route path="diagnostics" element={<DiagnosticsPage />} />
                  <Route path="faq" element={<Faq />} />
                  <Route path="start-here" element={<StartHere />} />
                  <Route path="mcc" element={<MarketingCommandCenter />} />
                </Route>
              </Route>

              {/* Fallback — render NotFound (noindex) instead of redirecting to /.
                  Previous redirect-to-/ caused Google to treat every unknown URL as
                  a duplicate of the homepage. NotFound emits robots=noindex,nofollow
                  so unknown URLs stop accumulating in the index. */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalSmartQuizReviewModal />
            <TestimonialPromptHost />
            </Suspense>
            </SmartQuizReviewProvider>
          </SubscriptionProvider>
        </ExamProvider>
      </SidebarProvider>
    </AuthProvider>
    </VersionGate>
    </AppErrorBoundary>
  );
}

export default App;

