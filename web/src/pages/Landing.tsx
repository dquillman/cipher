import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../App";
import { trackLandingPageView, trackCtaClick, trackPricingView, captureUtmParams } from "../lib/ga4";
import InteractiveDemo from "../components/InteractiveDemo";

/* ─── Shared icons & paths ────────────────────────────────────────────────── */
const Check = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XMark = () => (
  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ─── Smooth-scroll helper ─────────────────────────────────────────────────── */
const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ─── Scroll-reveal hook ───────────────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ─── Animated section wrapper ─────────────────────────────────────────────── */
function RevealSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </section>
  );
}

export default function Landing() {
  const location = useLocation();
  if (location.pathname !== "/") return null;

  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);

  // GA4: Track landing page view + capture UTM params from ad clicks
  useEffect(() => { captureUtmParams(); trackLandingPageView(); }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GA4: Fire pricing_view when comparison/pricing section scrolls into view
  useEffect(() => {
    const el = pricingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { trackPricingView(); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleCta = () => {
    trackCtaClick('landing');
    if (user) navigate("/app");
    else navigate("/login?mode=signup");
  };

  const handleMobileNav = useCallback((action: () => void) => {
    setMobileMenuOpen(false);
    action();
  }, []);

  /* ── Nav link style ─────────────────────────────────────────────────────── */
  const navLink = "text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block";

  /* ── Detect touch device for demo hint ──────────────────────────────────── */
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">

      {/* ─── NAVIGATION (sticky CTA appears on scroll) ────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="CipherExam" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight text-white font-display">CipherExam</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo("features")} className={navLink}>Features</button>
            <button onClick={() => scrollTo("exams")} className={navLink}>Exams</button>
            <button onClick={() => scrollTo("how-it-works")} className={navLink}>How It Works</button>
            <Link to="/pricing" className={navLink}>Pricing</Link>
            <Link to="/story" className={navLink}>Our Story</Link>
            <Link to="/blog" className={navLink}>Blog</Link>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden md:block"
            >
              Sign In
            </button>
            <button
              onClick={handleCta}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all hover:scale-105 hidden md:block ${
                scrolled
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
                  : "bg-white text-slate-950 hover:bg-slate-200"
              }`}
            >
              Start Free Trial
            </button>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out bg-slate-950/95 backdrop-blur-lg border-t border-white/5 ${
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-6 space-y-1">
            <button onClick={() => handleMobileNav(() => scrollTo("features"))} className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Features</button>
            <button onClick={() => handleMobileNav(() => scrollTo("exams"))} className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Exams</button>
            <button onClick={() => handleMobileNav(() => scrollTo("how-it-works"))} className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">How It Works</button>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Pricing</Link>
            <Link to="/story" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Our Story</Link>
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Blog</Link>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <button onClick={() => handleMobileNav(() => navigate("/login"))} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-white hover:bg-slate-800 transition-colors">Sign In</button>
              <button onClick={() => handleMobileNav(handleCta)} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-bold text-white hover:bg-brand-500 transition-colors">Start Free Trial</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ━━━ SECTION 1 — HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Atmospheric depth: dual gradient blobs + noise overlay */}
        <div className="absolute top-20 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute top-40 left-1/4 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute inset-0 -z-[5] opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            PMP · CompTIA · Scrum · SHRM · ITIL · AWS · 11+ Certifications
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6 leading-[1.1] font-display">
            Learn How Certification{" "}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500">
              Exams Think
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-3 leading-relaxed">
            CipherExam analyzes your answers and explains the reasoning behind every question.
          </p>

          <p className="mx-auto text-sm text-slate-500 mb-10">
            Start your free 7-day trial. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handleCta}
              className="w-full sm:w-auto rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 hover:scale-105 transition-all"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => scrollTo("differentiator")}
              className="w-full sm:w-auto rounded-full border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-white hover:bg-slate-800 transition-all"
            >
              See How It Works
            </button>
          </div>

          {/* Interactive Product Demo */}
          <div className="relative mx-auto max-w-3xl rounded-2xl shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/10 bg-gradient-to-b from-brand-500/[0.03] to-transparent p-1">
            <InteractiveDemo />
            <p className="text-xs text-slate-600 mt-3 text-center">
              {isTouchDevice ? "Tap to pause. Tap steps to skip ahead." : "Hover to pause. Click steps to skip ahead."}
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 2 — THE PROBLEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="problem" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
            Why Certification Exams Feel So Difficult
          </h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
            It's not a knowledge problem. It's a reasoning problem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: "🧠", title: "Questions Test Judgment", body: "Certification exams don't test what you memorized. They test how you think through scenarios." },
              { icon: "❌", title: "No One Explains Why", body: "Practice exams tell you right or wrong. They rarely explain the reasoning behind the correct answer." },
              { icon: "🔄", title: "Same Mistakes on Repeat", body: "Without understanding the logic, you keep falling for the same traps question after question." },
            ].map((c, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-3xl mb-4">{c.icon}</div>
                <div className="text-red-400 text-lg font-bold mb-2">{c.title}</div>
                <p className="text-slate-400 text-sm">{c.body}</p>
              </div>
            ))}
          </div>

          <p className="text-xl font-bold text-white">CipherExam fixes this.</p>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 3 — THE DIFFERENTIATOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="differentiator" className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
              See Exactly Why Answers Are Correct
            </h2>
            <p className="text-slate-400">
              Most tools just show right or wrong. CipherExam teaches the reasoning behind every answer.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Explanation mockup */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8">
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  A project manager discovers a team member is struggling with deliverables. What should the PM do first?
                </p>
              </div>

              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Your Answer: B</div>
                <p className="text-slate-400 text-sm">Reassign the task to another team member</p>
              </div>

              <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-4 space-y-2">
                <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
                  CipherExam Explanation
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">You chose B — reassigning the task.</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  But <span className="text-brand-400 font-semibold">servant leadership</span> is the PMI mindset
                  in this situation. The PM should first understand the obstacle and support the team member.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  That makes <span className="text-green-400 font-semibold">D — coach and support the team member</span> the
                  correct answer.
                </p>
              </div>
            </div>

            {/* Value text */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white font-display">This is how CipherExam teaches reasoning</h3>
              <p className="text-slate-400 leading-relaxed">
                Every question gets a detailed breakdown: why the correct answer works, why yours didn't, and the framework the exam uses to evaluate your thinking.
              </p>
              <ul className="space-y-3">
                {[
                  "Understand the logic, not just the answer",
                  "Learn the exam's decision-making framework",
                  "Stop repeating the same mistakes",
                  "Build real confidence, not false confidence",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                      <Check />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCta}
                className="mt-2 text-brand-400 font-bold hover:text-brand-300 flex items-center gap-2 group"
              >
                Try it free <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 4 — HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="how-it-works" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">How CipherExam Works</h2>
          <p className="text-slate-400 mb-16">Three steps to exam-ready confidence.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "1", title: "Choose Your Certification Exam", body: "Select from PMP, Security+, CSM, SHRM-CP, ITIL, Six Sigma, and more." },
              { n: "2", title: "Practice with AI Explanations", body: "Answer questions and get detailed reasoning breakdowns for every answer." },
              { n: "3", title: "Track Improvement with Analytics", body: "See your readiness score, weak domains, and progress over time." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-xl font-bold mb-4">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 5 — FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="features" className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">Powerful Study Tools</h2>
            <p className="text-slate-400">Built for professionals who need to pass on the first attempt.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "💡", title: "AI Explanation Engine", body: "Every answer includes a detailed breakdown of the reasoning and the exam's decision framework." },
              { icon: "📊", title: "Performance Analytics", body: "Mastery rings, readiness scores, and domain-level tracking show exactly where you stand." },
              { icon: "📋", title: "Certification Exam Coverage", body: "PMP, PgMP, Security+, Network+, A+, CSM, SHRM-CP, Six Sigma, ITIL, CIA, and CPP." },
              { icon: "🎯", title: "Personalized Practice", body: "The AI targets your weak spots and skips what you already know. Every question counts." },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-950 p-6 hover:border-brand-500/30 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 6 — EXAM COVERAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="exams" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
            Prepare for Multiple Certifications
          </h2>
          <p className="text-slate-400 mb-16">One platform. All the exams that matter.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "PMP", org: "PMI", live: true, color: "from-brand-500/20 to-brand-600/5 border-brand-500/25", icon: "📋" },
              { name: "Security+", org: "CompTIA", live: true, color: "from-red-500/20 to-red-600/5 border-red-500/25", icon: "🔒" },
              { name: "CSM", org: "Scrum Alliance", live: true, color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/25", icon: "🔄" },
              { name: "SHRM-CP", org: "SHRM", live: true, color: "from-purple-500/20 to-purple-600/5 border-purple-500/25", icon: "👥" },
              { name: "ITIL 4", org: "PeopleCert", live: true, color: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/25", icon: "⚙️" },
              { name: "Network+", org: "CompTIA", live: true, color: "from-orange-500/20 to-orange-600/5 border-orange-500/25", icon: "🌐" },
              { name: "A+ Core 2", org: "CompTIA", live: true, color: "from-pink-500/20 to-pink-600/5 border-pink-500/25", icon: "💻" },
              { name: "Six Sigma GB", org: "ASQ", live: true, color: "from-amber-500/20 to-amber-600/5 border-amber-500/25", icon: "📊" },
              { name: "PgMP", org: "PMI", live: true, color: "from-blue-500/20 to-blue-600/5 border-blue-500/25", icon: "🎯" },
              { name: "CIA Part 1", org: "IIA", live: true, color: "from-teal-500/20 to-teal-600/5 border-teal-500/25", icon: "🔍" },
              { name: "CISSP", org: "ISC²", live: false, color: "", icon: "🛡️" },
              { name: "AWS SAA", org: "Amazon", live: false, color: "", icon: "☁️" },
            ].map((e, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 text-center transition-all hover:scale-105 ${
                  e.live
                    ? `bg-gradient-to-b ${e.color} hover:shadow-lg hover:shadow-slate-900/50`
                    : "border-dashed border-brand-500/30 bg-slate-900/30 relative overflow-hidden"
                }`}
              >
                {!e.live && <div className="absolute inset-0 bg-slate-950/40" />}
                <div className={`relative ${!e.live ? "z-10" : ""}`}>
                  <div className="text-2xl mb-2">{e.icon}</div>
                  <div className="text-white font-bold text-sm">{e.name}</div>
                  <div className="text-slate-400 text-xs mt-1">{e.org}</div>
                  {!e.live && (
                    <>
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 rounded-full px-2 py-0.5">
                        Coming Soon
                      </span>
                      <div className="text-[9px] text-slate-500 mt-1.5 hover:text-brand-400 transition-colors cursor-pointer">Notify me</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 7 — COMPARISON / PRICING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="pricing" className="py-24 bg-slate-900/50">
        <div ref={pricingRef} className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 text-center font-display">
            CipherExam vs Traditional Exam Prep
          </h2>
          <p className="text-slate-400 text-center mb-12">See why professionals are switching.</p>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-500 font-medium" />
                  <th className="p-4 text-slate-400 font-semibold text-center">Traditional Prep</th>
                  <th className="p-4 text-brand-400 font-bold text-center bg-emerald-500/5">CipherExam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  ["Approach", "Memorize answers", "Understand reasoning"],
                  ["Explanations", "Generic or none", "AI-powered breakdowns"],
                  ["Question banks", "Static, one-size-fits-all", "Adaptive to your weak spots"],
                  ["Analytics", "Basic score only", "Domain-level performance tracking"],
                  ["Study plan", "Self-managed", "AI-personalized schedule"],
                ].map(([label, trad, ec], i) => (
                  <tr key={i}>
                    <td className="p-4 text-slate-300 font-medium">{label}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-red-400/70">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10"><XMark /></span>
                        <span className="text-slate-500">{trad}</span>
                      </span>
                    </td>
                    <td className="p-4 text-white text-center font-medium bg-emerald-500/5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-emerald-400">
                          <Check />
                        </span>
                        {ec}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-4">
            {[
              ["Approach", "Memorize answers", "Understand reasoning"],
              ["Explanations", "Generic or none", "AI-powered breakdowns"],
              ["Question banks", "Static, one-size-fits-all", "Adaptive to your weak spots"],
              ["Analytics", "Basic score only", "Domain-level performance tracking"],
              ["Study plan", "Self-managed", "AI-personalized schedule"],
            ].map(([label, trad, ec], i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</div>
                <div className="flex items-start gap-2 mb-2 text-slate-500 text-sm">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 mt-0.5">
                    <XMark />
                  </span>
                  <span>{trad}</span>
                </div>
                <div className="flex items-start gap-2 text-white text-sm font-medium">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 mt-0.5">
                    <Check />
                  </span>
                  <span>{ec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 9 — PLATFORM STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
              Built for Serious Exam Prep
            </h2>
            <p className="text-slate-400">The numbers behind the platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "11", label: "Certification exams" },
              { value: "AI", label: "Reasoning behind every answer" },
              { value: "7 days", label: "Free trial, no credit card" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8">
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500 font-display">
                  {s.value}
                </div>
                <div className="text-slate-400 text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 10 — STUDY SMARTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
            Study Smarter. Not Longer.
          </h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
            CipherExam eliminates wasted study time by focusing on what actually moves the needle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "🔍", title: "Identify Weak Areas Instantly", body: "The AI pinpoints exactly which domains need work after your first session." },
              { icon: "🔧", title: "Fix Recurring Mistakes", body: "Pattern detection finds the traps you keep falling for and drills them until they're gone." },
              { icon: "📈", title: "Focus on What Improves Scores", body: "Skip what you already know. Every minute of study time is spent on high-impact topics." },
            ].map((c, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-3xl mb-4">{c.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
                <p className="text-slate-400 text-sm">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 11 — FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600/10" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6 font-display">
            Stop Guessing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500">
              Start Thinking Like the Exam.
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join professionals preparing for certification exams with CipherExam.
          </p>
          <button
            onClick={handleCta}
            className="rounded-full bg-white px-10 py-4 text-lg font-bold text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all shadow-xl"
          >
            Start Your Free Trial
          </button>
          <p className="mt-6 text-sm text-slate-500">7-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="CipherExam" className="h-6 w-6 rounded object-contain" />
            <span className="text-slate-400 font-semibold">CipherExam</span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} CipherExam. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <Link to="/story" className="hover:text-white transition-colors">Our Story</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <a href="mailto:support@cipherexam.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* ─── SCROLL TO TOP ─────────────────────────────────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
