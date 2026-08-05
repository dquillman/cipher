import { useEffect, useRef, useState, useCallback } from "react";
import { SUPPORT_EMAIL } from '../config/support';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../App";
import { trackLandingPageView, trackCtaClick, trackPricingView, captureUtmParams } from "../lib/ga4";
import InteractiveDemo from "../components/InteractiveDemo";
import BloomsPrimer from "../components/BloomsPrimer";
import HeroBackground from "../components/landing/HeroBackground";
import DecodeWord from "../components/landing/DecodeWord";
import ReadinessVerdict from "../components/landing/ReadinessVerdict";
import { useHeroMotion } from "../components/landing/useHeroMotion";
import { useInView } from "../hooks/useInView";
import CountUp from "../components/CountUp";
import ScrollProgress from "../components/ScrollProgress";
import GuaranteeSeal from "../components/GuaranteeSeal";
import SeoHead from "../components/SeoHead";
import { SEO } from "../config/seo";
import {
  Scale, MessageSquareOff, Repeat,
  Lightbulb, BarChart3, ClipboardList, Crosshair,
  Search, Wrench, TrendingUp, ShieldCheck,
} from "lucide-react";

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

/* ─── Section eyebrow — monospace "decoded" index label ───────────────────── */
const Eyebrow = ({ n, label, center = false }: { n: string; label: string; center?: boolean }) => {
  // The little rule draws outward (scale-x) as the section enters view.
  const { ref, inView } = useInView<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className={`flex items-center gap-3 mb-5 ${center ? "justify-center" : ""}`}>
      <span className="font-mono text-[11px] tracking-[0.3em] text-brand-400">{n}</span>
      <span className={`h-px w-10 bg-brand-500/40 origin-left transition-transform duration-700 ease-out ${inView ? "scale-x-100" : "scale-x-0"}`} />
      <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-slate-500">{label}</span>
    </div>
  );
};

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Light GSAP polish scoped to the hero: WebGL parallax/fade on scroll +
  // magnetic CTAs. Dynamically imports gsap. (Runs regardless of OS reduce-motion.)
  useHeroMotion(heroRef);

  // Staggered reveal for the exam-coverage grid (§6).
  const { ref: examGridRef, inView: examGridIn } = useInView<HTMLDivElement>(0.12);

  // Magnetic pull on the nav + final "Start Free Trial" CTAs — mirrors the hero
  // CTA effect. Pointer-fine only (skipped on touch); gsap loads lazily.
  useEffect(() => {
    // OS reduce-motion intentionally not honoured (owner decision 2026-06-13).
    if (!window.matchMedia("(pointer: fine)").matches) return; // skip on touch
    const disposers: Array<() => void> = [];
    let cancelled = false;
    import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      document.querySelectorAll<HTMLElement>("[data-magnetic-cta]").forEach((btn) => {
        const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        const leave = () => { xTo(0); yTo(0); };
        btn.addEventListener("pointermove", move);
        btn.addEventListener("pointerleave", leave);
        disposers.push(() => {
          btn.removeEventListener("pointermove", move);
          btn.removeEventListener("pointerleave", leave);
        });
      });
    });
    return () => { cancelled = true; disposers.forEach((d) => d()); };
  }, []);

  // GA4: Track landing page view + capture UTM params from ad clicks
  useEffect(() => { captureUtmParams(); trackLandingPageView(); }, []);

  // Scroll to hash target when arriving from another page (e.g. /#testimonial from PublicNav)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Defer until after paint — reveal-on-scroll sections are hidden until observed.
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [location.hash]);

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

  if (location.pathname !== "/") return null;

  return (
    <div className="decoder bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead {...SEO.landing} />
      <ScrollProgress />

      {/* ─── NAVIGATION (sticky CTA appears on scroll) ────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="CipherExam" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-mono text-lg font-semibold text-brand-400" aria-hidden="true">⟨</span>
            <span className="text-lg font-bold tracking-tight text-white font-display">CipherExam</span>
            <span className="font-mono text-lg font-semibold text-brand-400" aria-hidden="true">⟩</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo("features")} className={navLink}>Features</button>
            <button onClick={() => scrollTo("exams")} className={navLink}>Exams</button>
            <button onClick={() => scrollTo("how-it-works")} className={navLink}>How It Works</button>
            <Link to="/pricing" className={navLink}>Pricing</Link>
            <Link to="/story" className={navLink}>Our Story</Link>
            <Link to="/blog" className={navLink}>Blog</Link>
            <Link to="/exam-lens" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden lg:block">Exam Lens</Link>
            <button
              onClick={() => scrollTo("testimonial")}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-300 hover:bg-brand-500/20 hover:border-brand-400/50 hover:text-brand-200 transition-all"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm10 0a5.17 5.17 0 00-5.17 5.17V18h6.83v-6.83H15.5A1.67 1.67 0 0117.17 9.5V6z" />
              </svg>
              Testimonials
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden md:block"
            >
              Sign In
            </button>
            <button
              onClick={handleCta}
              data-magnetic-cta
              className={`rounded-md px-5 py-2 text-sm font-bold transition-colors hidden md:block ${
                scrolled
                  ? "cta-decode shadow-lg shadow-brand-500/25"
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
            <Link to="/exam-lens" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Exam Lens</Link>
            <button
              onClick={() => handleMobileNav(() => scrollTo("testimonial"))}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-base font-bold border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm10 0a5.17 5.17 0 00-5.17 5.17V18h6.83v-6.83H15.5A1.67 1.67 0 0117.17 9.5V6z" />
              </svg>
              Testimonials
            </button>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <button onClick={() => handleMobileNav(() => navigate("/login"))} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-white hover:bg-slate-800 transition-colors">Sign In</button>
              <button onClick={() => handleMobileNav(handleCta)} className="cta-decode w-full rounded-xl px-4 py-3 text-base transition-colors">Start Free Trial</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ━━━ SECTION 1 — HERO (asymmetric split: copy left, live demo right) ━ */}
      {/* `isolate` scopes the negative-z ambient layers to this section —
          without it they paint UNDER the page wrapper's bg and are invisible */}
      <section ref={heroRef} className="relative isolate pt-32 pb-20 overflow-hidden">
        {/* Ambient light-stream image (Higgsfield) — the still base + SSR/reduced-motion fallback */}
        <div className="absolute inset-0 -z-[8] overflow-hidden" aria-hidden="true">
          <img
            src="/media/hero-ambient.jpg"
            alt=""
            className="hero-ambient h-full w-full object-cover opacity-25 [mask-image:linear-gradient(to_bottom,black_35%,transparent_96%)]"
          />
        </div>
        {/* WebGL "data current" — fades in over the still image (client-only, gated) */}
        <div
          data-hero-parallax
          className="absolute inset-0 -z-[7] [mask-image:linear-gradient(to_bottom,black_30%,transparent_92%)]"
          aria-hidden="true"
        >
          <HeroBackground className="absolute inset-0" />
        </div>
        {/* Atmospheric depth: blueprint grid + gradient blobs + noise overlay */}
        <div className="absolute inset-0 -z-[6] [background-image:linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
        <div className="blob-a absolute top-20 left-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="blob-b absolute top-40 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute inset-0 -z-[5] opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">
            {/* Left: headline + CTAs */}
            <div className="lg:col-span-6 text-center lg:text-left">
              {/* Badge */}
              <div className="hero-enter hero-enter-1 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 font-mono text-[11px] tracking-wider text-brand-300 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
                PMP · CompTIA · Scrum · SHRM · ITIL · AWS · 11+ Certifications
              </div>

              <h1 className="hero-enter hero-enter-2 text-5xl font-extrabold tracking-tight text-white sm:text-6xl xl:text-7xl mb-6 leading-[1.05] font-display">
                Learn How Certification Exams{" "}
                <DecodeWord text="Think" />
              </h1>

              <p className="hero-enter hero-enter-3 max-w-xl mx-auto lg:mx-0 text-lg text-slate-400 mb-3 leading-relaxed">
                CipherExam analyzes your answers and explains the reasoning behind every question.
              </p>

              <p className="hero-enter hero-enter-4 font-mono text-xs tracking-wide text-slate-500 mb-10">
                Free 7-day trial — no credit card required.
              </p>

              <div className="hero-enter hero-enter-5 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-10">
                <button
                  onClick={handleCta}
                  data-magnetic
                  className="cta-breathe cta-decode cta-ticks w-full sm:w-auto rounded-md px-8 py-4 text-base transition-colors"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => scrollTo("differentiator")}
                  className="w-full sm:w-auto rounded-md border border-slate-700 bg-slate-800/40 px-8 py-4 font-mono text-sm font-medium text-slate-300 hover:border-brand-400/50 hover:text-brand-300 transition-colors"
                >
                  See How It Works
                </button>
              </div>

              {/* Trust badge — pull-quote credibility */}
              <a
                href="#testimonial"
                className="hero-enter hero-enter-6 group inline-flex flex-col sm:flex-row items-center gap-3 rounded-full border border-slate-800 bg-slate-900/50 px-5 py-3 hover:border-slate-700 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-brand-400 text-xl leading-none">"</span>
                  <span className="text-sm text-slate-300 italic">…the exam-specific reasoning frameworks…</span>
                  <span className="text-brand-400 text-xl leading-none">"</span>
                </div>
                <span className="hidden sm:block text-slate-700">|</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                  <span className="font-semibold text-slate-300">PMI AI Standards Core Team Member</span>
                </span>
              </a>
            </div>

            {/* Right: live product demo */}
            <div className="lg:col-span-6 hero-enter hero-enter-4 relative">
              {/* Gold guarantee seal — stuck on the demo panel's corner, front and
                  center in the hero so the risk-reversal is the first thing seen */}
              <div className="absolute -top-7 -right-2 z-20 pointer-events-none max-lg:scale-[0.8] max-lg:origin-top-right">
                <GuaranteeSeal size={132} tilt={-12} animate />
              </div>
              <div className="demo-float scan-wrap relative rounded-2xl shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/10 bg-gradient-to-b from-brand-500/[0.03] to-transparent p-1 overflow-hidden">
                <div className="scanline" aria-hidden="true" />
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-400 shadow-[0_0_8px] shadow-brand-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="ml-2 font-mono text-[10px] tracking-widest text-slate-500 uppercase">cipher · live decode</span>
                </div>
                <InteractiveDemo />
                <p className="text-xs text-slate-600 mt-2 pb-2 text-center">
                  {isTouchDevice ? "Tap to pause. Tap steps to skip ahead." : "Hover to pause. Click steps to skip ahead."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ EXAM TICKER — decorative marquee (Decoder identity) ━━━━━━━━━━━ */}
      <div className="ticker border-y border-slate-800/80" aria-hidden="true">
        <div className="ticker-track">
          {[
            "PMP · 180Q BANK", "SECURITY+ · SY0-701", "CSM · SCRUM ALLIANCE", "SHRM-CP · HR",
            "ITIL 4 · FOUNDATION", "NETWORK+ · N10-009", "A+ CORE 2 · 220-1102", "SIX SIGMA · GREEN BELT",
            "PGMP · PROGRAM MGMT", "CIA · PART 1", "CISSP · COMING SOON", "AWS SAA · COMING SOON",
          ].concat([
            "PMP · 180Q BANK", "SECURITY+ · SY0-701", "CSM · SCRUM ALLIANCE", "SHRM-CP · HR",
            "ITIL 4 · FOUNDATION", "NETWORK+ · N10-009", "A+ CORE 2 · 220-1102", "SIX SIGMA · GREEN BELT",
            "PGMP · PROGRAM MGMT", "CIA · PART 1", "CISSP · COMING SOON", "AWS SAA · COMING SOON",
          ]).map((t, i) => (
            <span key={i} className="font-mono text-[11px] tracking-[0.22em] text-slate-500 px-7 py-3 border-r border-slate-800/80">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ━━━ SECTION 2 — THE PROBLEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="problem" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: section heading */}
            <div className="lg:col-span-5">
              <Eyebrow n="01" label="The Problem" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display leading-tight">
                Why Certification Exams Feel So Difficult
              </h2>
              <p className="text-slate-400 mb-8">
                It's not a knowledge problem. It's a reasoning problem.
              </p>
              <p className="text-xl font-bold text-white hidden lg:block">CipherExam fixes this.</p>
            </div>

            {/* Right: numbered editorial rows */}
            <div className="lg:col-span-7">
              {[
                { icon: Scale, title: "Questions Test Judgment", body: "Certification exams don't test what you memorized. They test how you think through scenarios." },
                { icon: MessageSquareOff, title: "No One Explains Why", body: "Practice exams tell you right or wrong. They rarely explain the reasoning behind the correct answer." },
                { icon: Repeat, title: "Same Mistakes on Repeat", body: "Without understanding the logic, you keep falling for the same traps question after question." },
              ].map(({ icon: Icon, title, body }, i) => (
                <div key={i} className="group flex items-start gap-5 border-t border-slate-800 py-7 first:border-t-0 first:pt-0">
                  <span className="font-mono text-sm text-red-400/70 pt-1 w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-white text-lg font-bold mb-1.5">{title}</div>
                    <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
              <p className="text-xl font-bold text-white mt-8 lg:hidden">CipherExam fixes this.</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 3 — THE DIFFERENTIATOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="differentiator" className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow n="02" label="The Fix" center />
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

      {/* ━━━ SECTION 3.5 — BLOOM'S TAXONOMY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="blooms" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Eyebrow n="03" label="The Cipher Difference" center />
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
              You're Not Failing Because You Don't Know It.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              You're failing because you studied to <em className="text-slate-300">remember</em> — and
              the exam tested whether you could <em className="text-slate-300">apply</em>, <em className="text-slate-300">analyze</em>,
              and <em className="text-slate-300">evaluate</em>. Those are different cognitive skills.
              CIPHER is the only exam-prep platform that tags every question with the level
              of thinking it demands, so you can finally see <strong className="text-white">where your real gap is</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: the primer itself */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
              <BloomsPrimer variant="panel" showExamples={true} />
            </div>

            {/* Right: why it matters */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white font-display">
                Every other app ignores this. We built around it.
              </h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 mt-0.5">
                    <Check />
                  </div>
                  <div>
                    <strong className="text-white">Lifetime Bloom's Heatmap.</strong>{" "}
                    See your accuracy at every cognitive level in one glance. Strong on Remember, weak on Apply? You'll know exactly.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 mt-0.5">
                    <Check />
                  </div>
                  <div>
                    <strong className="text-white">Per-question Bloom tag.</strong>{" "}
                    Every question in every quiz shows its cognitive level. No more guessing whether you got it wrong because you didn't know the fact or couldn't apply it.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 mt-0.5">
                    <Check />
                  </div>
                  <div>
                    <strong className="text-white">Biggest Gap callout.</strong>{" "}
                    The heatmap surfaces your weakest level automatically. That's your highest-ROI study target.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 mt-0.5">
                    <Check />
                  </div>
                  <div>
                    <strong className="text-white">Zero flashcard-bias.</strong>{" "}
                    Other tools optimize for recall because it's easy to measure. CIPHER optimizes for the levels the exam actually tests.
                  </div>
                </li>
              </ul>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={handleCta}
                  className="text-brand-400 font-bold hover:text-brand-300 flex items-center gap-2 group"
                >
                  Try it free <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <Link
                  to="/blog/study-by-blooms-level"
                  className="text-slate-400 font-bold hover:text-white flex items-center gap-2 group"
                >
                  Read the full framework <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 4 — HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="how-it-works" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow n="04" label="How It Works" center />
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">How CipherExam Works</h2>
          <p className="text-slate-400 mb-16">Three steps to exam-ready confidence.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-left">
            {[
              { n: "01", title: "Choose Your Certification Exam", body: "Select from PMP, Security+, CSM, SHRM-CP, ITIL, Six Sigma, and more." },
              { n: "02", title: "Practice with AI Explanations", body: "Every answer is explained through the Exam Lens for that cert — the reasoning frame the test grades against." },
              { n: "03", title: "Track Improvement with Analytics", body: "See your readiness score, weak domains, and progress over time." },
            ].map((s, i) => (
              <div key={i} className="border-t-2 border-brand-500/40 pt-6">
                <div className="font-mono text-sm text-brand-400 mb-3">{s.n}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-sm text-slate-400">
            Every cert has its own reasoning frame.{' '}
            <Link to="/exam-lens" className="text-brand-400 hover:text-brand-300 underline underline-offset-2 font-semibold">
              See the Exam Lens for each exam →
            </Link>
          </p>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 5 — FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="features" className="py-24 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Heading on the right for rhythm (mirrors the Problem section) */}
            <div className="lg:col-span-5 lg:order-2">
              <Eyebrow n="05" label="Study Tools" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display leading-tight">Powerful Study Tools</h2>
              <p className="text-slate-400">Built for professionals who need to pass on the first attempt.</p>
            </div>

            <div className="lg:col-span-7 lg:order-1">
              {[
                { icon: Lightbulb, title: "AI Explanation Engine", body: "Every answer includes a detailed breakdown of the reasoning and the exam's decision framework." },
                { icon: BarChart3, title: "Performance Analytics", body: "Mastery rings, readiness scores, and domain-level tracking show exactly where you stand." },
                { icon: ClipboardList, title: "Certification Exam Coverage", body: "PMP, PgMP, Security+, Network+, A+, CSM, SHRM-CP, Six Sigma, ITIL, CIA, and CPP." },
                { icon: Crosshair, title: "Personalized Practice", body: "The AI targets your weak spots and skips what you already know. Every question counts." },
              ].map(({ icon: Icon, title, body }, i) => (
                <div key={i} className="flex items-start gap-5 border-t border-slate-800 py-7 first:border-t-0 first:pt-0">
                  <span className="font-mono text-sm text-brand-400/70 pt-1 w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-400">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 6 — EXAM COVERAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="exams" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Eyebrow n="06" label="Exam Coverage" center />
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
            Prepare for Multiple Certifications
          </h2>
          <p className="text-slate-400 mb-16">One platform. All the exams that matter.</p>

          <div ref={examGridRef} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${examGridIn ? "is-in" : ""}`}>
            {[
              { name: "PMP", org: "PMI", live: true, lp: "/lp/pmp", color: "from-brand-500/20 to-brand-600/5 border-brand-500/25" },
              { name: "Security+", org: "CompTIA", live: true, lp: "/lp/security-plus", color: "from-red-500/20 to-red-600/5 border-red-500/25" },
              { name: "CSM", org: "Scrum Alliance", live: true, lp: "/lp/csm", color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/25" },
              { name: "SHRM-CP", org: "SHRM", live: true, lp: "/lp/shrm-cp", color: "from-purple-500/20 to-purple-600/5 border-purple-500/25" },
              { name: "ITIL 4", org: "PeopleCert", live: true, lp: "/lp/itil", color: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/25" },
              { name: "Network+", org: "CompTIA", live: true, lp: "/lp/network-plus", color: "from-orange-500/20 to-orange-600/5 border-orange-500/25" },
              { name: "A+ Core 2", org: "CompTIA", live: true, lp: "/lp/a-plus-core-2", color: "from-pink-500/20 to-pink-600/5 border-pink-500/25" },
              { name: "Six Sigma GB", org: "ASQ", live: true, lp: "/lp/six-sigma", color: "from-amber-500/20 to-amber-600/5 border-amber-500/25" },
              { name: "PgMP", org: "PMI", live: true, lp: "/lp/pgmp", color: "from-blue-500/20 to-blue-600/5 border-blue-500/25" },
              { name: "CIA Part 1", org: "IIA", live: true, lp: "/lp/cia", color: "from-teal-500/20 to-teal-600/5 border-teal-500/25" },
              { name: "CISSP", org: "ISC²", live: false, lp: null, color: "" },
              { name: "AWS SAA", org: "Amazon", live: false, lp: null, color: "" },
            ].map((e, i) => {
              const base = `rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5 ${
                e.live
                  ? `bg-gradient-to-b ${e.color} hover:shadow-lg hover:shadow-slate-900/50`
                  : "border-dashed border-brand-500/30 bg-slate-900/30 relative overflow-hidden"
              }`;

              // Live exams link to their dedicated landing page.
              if (e.live && e.lp) {
                return (
                  <Link
                    key={i}
                    to={e.lp}
                    onClick={() => trackCtaClick(`exam-card-${e.lp.slice(4)}`)}
                    aria-label={`Practice ${e.name} (${e.org})`}
                    style={{ transitionDelay: `${i * 0.04}s` }}
                    className={`reveal-fade group block ${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70`}
                  >
                    <div className="text-white font-bold text-sm">{e.name}</div>
                    <div className="text-slate-400 text-xs mt-1">{e.org}</div>
                    <span className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-300 opacity-0 transition-opacity group-hover:opacity-100">
                      Practice <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </Link>
                );
              }

              // Coming-soon exams: not yet clickable — keep the Notify me affordance.
              return (
                <div key={i} style={{ transitionDelay: `${i * 0.04}s` }} className={`reveal-fade ${base}`}>
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="relative z-10">
                    <div className="text-white font-bold text-sm">{e.name}</div>
                    <div className="text-slate-400 text-xs mt-1">{e.org}</div>
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 rounded-full px-2 py-0.5">
                      Coming Soon
                    </span>
                    <div className="text-[9px] text-slate-500 mt-1.5 hover:text-brand-400 transition-colors cursor-pointer">Notify me</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 7 — THE READINESS VERDICT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="readiness-verdict" className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Eyebrow n="07" label="The Readiness Verdict" center />
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
              Most apps say you’re ready. We tell you the truth.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Every full mock exam returns a real score, an honest pass/fail verdict, and a
              domain-by-domain breakdown of exactly where you’re losing points — then drops you
              straight into targeted practice on your weakest area. No inflated readiness meters.
              No false confidence walking into the real thing.
            </p>
          </div>

          <ReadinessVerdict />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { k: "No inflation", title: "A verdict, not a vibe", body: "A real pass/fail against the actual passing bar — so you find out here, not on exam day." },
              { k: "Domain x-ray", title: "See where the points leak", body: "Per-domain accuracy shows precisely which objectives are dragging your score down." },
              { k: "One click to fix", title: "Straight into the fix", body: "Smart Practice auto-targets your weakest domain. Your diagnosis becomes your next session." },
            ].map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="font-mono text-[11px] tracking-[0.16em] text-brand-400 uppercase mb-2.5">// {p.k}</div>
                <h3 className="text-lg font-bold text-white font-display mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 8 — COMPARISON / PRICING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="pricing" className="py-24 bg-slate-900/50">
        <div ref={pricingRef} className="mx-auto max-w-3xl px-6">
          <Eyebrow n="08" label="Comparison" center />
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
            <Eyebrow n="09" label="By the Numbers" center />
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
              Built for Serious Exam Prep
            </h2>
            <p className="text-slate-400">The numbers behind the platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-y border-slate-800">
            {[
              { value: "11", label: "Certification exams" },
              { value: "AI", label: "Reasoning behind every answer" },
              { value: "7 days", label: "Free trial, no credit card" },
            ].map((s, i) => (
              <div key={i} className="px-8 py-10 text-center">
                <div className="text-5xl sm:text-6xl font-extrabold text-white font-display tracking-tight">
                  <CountUp value={s.value} />
                </div>
                <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-slate-500 mt-4">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 10 — STUDY SMARTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow n="10" label="Study Smarter" center />
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 font-display">
            Study Smarter. Not Longer.
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl mx-auto">
            CipherExam eliminates wasted study time by focusing on what actually moves the needle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-left">
            {[
              { icon: Search, title: "Identify Weak Areas Instantly", body: "The AI pinpoints exactly which domains need work after your first session." },
              { icon: Wrench, title: "Fix Recurring Mistakes", body: "Pattern detection finds the traps you keep falling for and drills them until they're gone." },
              { icon: TrendingUp, title: "Focus on What Improves Scores", body: "Skip what you already know. Every minute of study time is spent on high-impact topics." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={i} className="border-t-2 border-brand-500/40 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm text-brand-400">{String(i + 1).padStart(2, "0")}</span>
                  <Icon className="h-5 w-5 text-brand-400" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 10.5 — TESTIMONIAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <RevealSection id="testimonial" className="py-24 bg-slate-900/50 border-t border-slate-900">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-10">
            <Eyebrow n="11" label="From Beta Testing" center />
          </div>

          <figure className="relative rounded-2xl border border-slate-800 bg-slate-950 p-8 sm:p-12">
            <svg
              className="absolute -top-5 left-8 h-10 w-10 text-brand-500/60"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm10 0a5.17 5.17 0 00-5.17 5.17V18h6.83v-6.83H15.5A1.67 1.67 0 0117.17 9.5V6z" />
            </svg>

            <blockquote className="text-lg sm:text-xl text-slate-200 leading-relaxed font-medium">
              "What you have built is differentiated by the{" "}
              <span className="text-brand-400">coaching lens approach</span>, the{" "}
              <span className="text-brand-400">exam-specific reasoning frameworks</span>, and the{" "}
              <span className="text-brand-400">feedback loop you ran with real testers</span>."
            </blockquote>

            {/* Attribution intentionally anonymized — credential only, no name.
                Per project_canonical_testimonial.md (memory) — protects source
                identity and gives GDPR-safe rescindability (Art. 7(3)). */}
            <figcaption className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-blue-500/20 border border-brand-500/30 text-brand-300 text-3xl leading-none font-serif" aria-hidden="true">
                &ldquo;
              </div>
              <div>
                <div className="text-white font-bold">PMI AI Standards Core Team Member</div>
                <div className="text-slate-400 text-sm mt-0.5">During CipherExam beta testing</div>
              </div>
            </figcaption>
          </figure>
        </div>
      </RevealSection>

      {/* ━━━ SECTION 11 — FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600/10" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
        {/* Gold guarantee seal, tucked into the corner like a sticker. */}
        <GuaranteeSeal size={132} tilt={-13} className="hidden lg:block absolute top-10 right-10 z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6 font-display">
            Stop Guessing.{" "}
            <span className="text-brand-400">
              Start Thinking Like the Exam.
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join professionals preparing for certification exams with CipherExam.
          </p>
          {/* Price, up front — no click-through to /pricing just to see the cost.
              Exam Pass leads (most popular); subscription is the alternative. */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 px-6 py-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-white font-display">$59</span>
                  <span className="text-sm text-slate-300">Exam Pass · 90 days</span>
                </div>
                <p className="mt-1 font-mono text-[11px] tracking-wide text-brand-200">Most popular · one-time · nothing to cancel</p>
              </div>
              <span className="font-mono text-sm text-slate-600">or</span>
              <div>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-bold text-white">$19</span>
                  <span className="text-sm text-slate-400">/mo</span>
                </div>
                <p className="mt-1 font-mono text-[11px] tracking-wide text-slate-500">free tier · cancel anytime</p>
              </div>
            </div>
            <p className="font-mono text-[11px] tracking-wide text-slate-500">Both backed by the 60-day money-back guarantee.</p>
          </div>
          <button
            onClick={handleCta}
            data-magnetic-cta
            className="rounded-full bg-white px-10 py-4 text-lg font-bold text-slate-900 hover:bg-slate-100 transition-colors shadow-xl"
          >
            Start Your Free Trial
          </button>
          <p className="mt-6 font-mono text-xs tracking-wide text-slate-500">7-day free trial — no credit card required.</p>
          <p className="mt-2 inline-flex items-center gap-2 font-mono text-xs tracking-wide text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Plus a 60-day money-back guarantee — no conditions.
          </p>
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
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">Contact</a>
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
