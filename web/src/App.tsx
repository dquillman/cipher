import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import React, { useEffect, useRef, useState, createContext, useContext, Suspense, type ReactNode } from "react";
import { lazyWithReload as lazy, isDeployChunkError } from "./utils/lazyWithReload";
import type { Auth, User } from "firebase/auth";
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
// Additional cert LPs (added 2026-06-13 — one per live exam, linked from the home Exam Coverage grid)
const NetworkPlusPracticeLP = lazy(() => import("./pages/landing/NetworkPlusPracticeLP"));
const APlusCore2PracticeLP = lazy(() => import("./pages/landing/APlusCore2PracticeLP"));
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
// Lazy: reaches Firestore via TestimonialService, and nothing about it needs
// to be in the first byte of the entry chunk.
const TestimonialPromptHost = lazy(() => import("./components/TestimonialPromptHost"));

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

// Firestore-heavy and meaningless without a signed-in user, so it is mounted
// as a lazy child of AuthProvider rather than called as a hook here.
// React.lazy, not lazyWithReload: this one takes props and lazyWithReload is
// typed for prop-less page chunks.
const SessionTracker = React.lazy(() => import("./components/SessionTracker"));
// Provider scope for /app/* (Exam + Subscription + SmartQuizReview).
const AppScope = lazy(() => import("./AppScope"));

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRef = useRef<Auth | null>(null);
  // Filled in by <SessionTracker> once it has loaded and a user exists.
  const closeSessionRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    // Auth is irrelevant to the public page's first paint. Loading it here
    // keeps Firebase out of the critical entry graph while preserving the same
    // provider contract for login and /app routes.
    const initialize = () => void Promise.all([import("firebase/auth"), import("./firebase-app")])
      .then(([{ onAuthStateChanged }, { auth }]) => {
        if (cancelled || !auth) return;
        authRef.current = auth;
        unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Firebase Auth initialization failed:", error);
        if (!cancelled) setLoading(false);
      });

    // Public pages can render without identity. On those routes, wait until
    // after load and a generous idle window so Firebase's auth iframe and API
    // bootstrap cannot contend with the hero's LCP. Login and app routes still
    // initialize immediately.
    const publicRoute = !window.location.pathname.startsWith('/app') &&
      window.location.pathname !== '/login';
    const disposeInitialization = publicRoute
      ? afterPaint(initialize, 8000)
      : (() => { initialize(); return () => {}; })();

    return () => {
      cancelled = true;
      disposeInitialization();
      unsubscribe();
    };
  }, []);

  // useSessionTracker used to clear this whenever it saw a null user. It is no
  // longer mounted for signed-out visitors, so the cleanup lives here instead.
  useEffect(() => {
    if (!user) sessionStorage.removeItem('ecp_session_id');
  }, [user]);

  const logout = async () => {
    // Signing out must never wait on analytics. closeSession awaits an
    // updateDoc, and a Firestore write resolves only on server ack — so on a
    // stalled connection it neither resolved nor rejected, and because
    // closeSession swallows its own errors the catch below could never fire.
    // Pressing Log out simply did nothing. Bounded, and the sign-out happens
    // either way.
    await withTimeout(closeSessionRef.current(), 2500, 'closeSession');
    try {
      const activeAuth = authRef.current;
      if (!activeAuth) return;
      const { signOut } = await import("firebase/auth");
      await signOut(activeAuth);
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {user && (
        <Suspense fallback={null}>
          <SessionTracker user={user} closeRef={closeSessionRef} />
        </Suspense>
      )}
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

// firestore.googleapis.com REST endpoint for app_config/version. The project id
// and web API key are the same public values already shipped in firebase-app.ts.
const VERSION_DOC_URL =
  'https://firestore.googleapis.com/v1/projects/exam-coach-ai-platform' +
  '/databases/(default)/documents/app_config/version' +
  '?key=AIzaSyBBlyZqdAJw_yNNfUQfVW59eYgkrBJLUCQ';

function VersionGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VersionStatus>('loading');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        // Read over the Firestore REST API rather than the SDK.
        //
        // This is one public document, read once, before anyone is signed in.
        // Reaching it through the SDK meant `import('firebase/firestore')` —
        // 344KB of client — downloaded on EVERY page load, landing page and
        // blog included, to fetch two version strings. REST gets the same
        // document from the same database with a single fetch and no bundle.
        //
        // Requires app_config/version to stay world-readable in the security
        // rules. If that ever changes the fetch 401s, the catch below fires,
        // and the gate fails open exactly as it does when the user is offline.
        const res = await fetch(VERSION_DOC_URL, { cache: 'no-store' });

        if (cancelled) return;

        if (res.status === 404) {
          // Document does not exist — same as the old !snap.exists() branch.
          setStatus('ok');
          return;
        }
        if (!res.ok) throw new Error(`version check HTTP ${res.status}`);

        const fields = (await res.json())?.fields ?? {};

        if (cancelled) return;

        const remoteLatest: string | undefined = fields.latest?.stringValue;
        const remoteMinimum: string | undefined = fields.minimum?.stringValue;

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

    // Marketing pages do not run the version check at all.
    //
    // The gate exists to stop a STALE CACHED APP from talking to a newer
    // backend. A visitor reading the landing page or a blog post has no app
    // state to be stale, so the request bought them nothing — and PageSpeed
    // measured it at 1,877ms of critical-path latency on mobile, on every
    // marketing pageview, for a document that currently returns 404. Entering
    // /app/* is the moment staleness starts to matter, so check there.
    if (!window.location.pathname.startsWith('/app')) {
      setStatus('ok');
      return;
    }

    // Deferred to idle. The check gates nothing — children render while it is
    // in flight — but firing it during page load meant the round-trip
    // competed with LCP.
    // Safari only shipped requestIdleCallback in 18.4, so keep the timer path.
    const idle = typeof window.requestIdleCallback === 'function';
    const handle = idle
      ? window.requestIdleCallback(check, { timeout: 5000 })
      : window.setTimeout(check, 2000);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
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
        <div className="flex min-h-dvh items-center justify-center bg-slate-900 text-white">
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
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Outlet />;
  if (user) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}

// App-only chunks. Kept out of the entry graph on purpose: each of these
// reaches Firestore through a service or context, and none of them renders on
// a public route.
const AppLayout = lazy(() => import("./AppLayout"));
const MockExamGuard = lazy(() => import("./components/MockExamGuard"));

// --- Analytics Hook ---
import { withTimeout } from './utils/withTimeout';
import { afterPaint } from './utils/afterPaint';

function useAnalytics() {
  useEffect(() => {
    let cancelled = false;
    const trackVisit = async () => {
      // Basic unique session tracking
      if (sessionStorage.getItem('visited_session')) return;

      try {
        const [{ httpsCallable }, { functions }] = await Promise.all([
          import('firebase/functions'),
          import('./firebase-app'),
        ]);
        if (cancelled) return;
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

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(() => void trackVisit(), { timeout: 8000 });
      }
      return window.setTimeout(() => void trackVisit(), 4000);
    };
    const start = () => { if (!cancelled) schedule(); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
    };
  }, []);
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
          <div className="flex min-h-dvh items-center justify-center bg-slate-900 text-white p-8">
            <div className="max-w-md text-center">
              <h1 className="text-2xl font-bold text-white mb-3 font-display">A new version is available</h1>
              <p className="text-slate-400 mb-6">CipherExam was just updated. Reload to get the latest — your progress is saved.</p>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold transition-colors">Reload</button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-900 text-white p-8">
          <div className="max-w-lg text-center">
            {/* This used to print error.message and error.stack straight into a
                <pre>. A non-engineer got a wall of minified stack frames and one
                button that reloaded them into the same crash. The stack is still
                worth having, so it moves behind a disclosure. */}
            <h1 className="text-2xl font-bold text-white mb-3 font-display">Something broke on this page</h1>
            <p className="text-slate-400 mb-6">
              This is our bug, not something you did, and your progress is saved. Going back to the
              dashboard usually clears it. If it keeps happening, Report a Problem — in the sidebar on desktop, or under More on a phone
              tells us where it broke.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { window.location.href = '/app'; }}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-bold transition-colors"
              >
                Back to dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-slate-700 hover:bg-slate-800 rounded-lg font-medium transition-colors"
              >
                Try this page again
              </button>
            </div>
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-xs uppercase tracking-wider text-slate-500 hover:text-slate-400">Technical detail</summary>
              <pre className="mt-3 text-left text-xs text-slate-400 bg-slate-800 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
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
            <Suspense fallback={
              <div className="flex h-dvh items-center justify-center bg-slate-900 text-white">
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
              <Route path="/lp/network-plus" element={<NetworkPlusPracticeLP />} />
              <Route path="/lp/a-plus-core-2" element={<APlusCore2PracticeLP />} />
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
              {/* AppScope carries ExamProvider/SubscriptionProvider/SmartQuizReview.
                  They used to wrap every route, which made the landing page and
                  the blog load fb-firestore to render static text. */}
              <Route path="/app/*" element={<AppScope />}>
                <Route element={<RequireAuth />}>
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
                  </Route>
                  {/* Outside the guard on purpose: results are a record of a
                      sitting the user already completed, and paid for at the
                      time. Gating them meant a lapsed pass turned their own
                      exam history into a "this is a Pro feature" wall. */}
                  <Route path="simulator/results" element={<SimulatorResults />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="planner" element={<StudySchedule />} />
                  <Route path="planner/setup" element={<SetupPlanner />} />
                  <Route path="verbal" element={<VerbalMode />} />
                  <Route path="readiness" element={<ReadinessReportPage />} />
                  <Route path="diagnostics" element={<DiagnosticsPage />} />
                  <Route path="faq" element={<Faq />} />
                  <Route path="start-here" element={<StartHere />} />
                  <Route path="mcc" element={<MarketingCommandCenter />} />
                  {/* Without this, any unknown path under /app/* matched the
                      parent route, rendered AppLayout, and left the Outlet
                      empty — an entirely blank dark screen with no sidebar, no
                      header and no way back. /app/dashboard did exactly that,
                      and it is a URL people guess and bookmark. */}
                  <Route path="*" element={<NotFound />} />
                </Route>
                </Route>
              </Route>

              {/* Fallback — render NotFound (noindex) instead of redirecting to /.
                  Previous redirect-to-/ caused Google to treat every unknown URL as
                  a duplicate of the homepage. NotFound emits robots=noindex,nofollow
                  so unknown URLs stop accumulating in the index. */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <TestimonialPromptHost />
            </Suspense>
    </AuthProvider>
    </VersionGate>
    </AppErrorBoundary>
  );
}

export default App;
