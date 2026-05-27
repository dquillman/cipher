import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { captureUtmParams, trackLandingPageView, trackCtaClick } from "../../lib/ga4";

/**
 * Shared layout shell for Tier 1 ad landing pages (/lp/*).
 *
 * Intentionally stripped-down vs. the main site nav — no top-of-funnel
 * navigation links, just brand + a single Start Free Trial CTA. The
 * point of an ad LP is to convert the visitor that the ad sent here,
 * not to send them browsing the rest of the site.
 *
 * Each cert-specific LP wraps its content in <LandingShell exam="..." />.
 */
export interface LandingShellProps {
  /** Cert slug used in the signup pre-select query param (pmp | security-plus | shrm-cp) */
  exam: "pmp" | "security-plus" | "shrm-cp";
  /** Cert short name shown in the header CTA */
  examShortName: string;
  /** Identifier passed to trackLandingPageView / trackCtaClick for cluster attribution */
  pageId: string;
  children: ReactNode;
}

export default function LandingShell({ exam, examShortName, pageId, children }: LandingShellProps) {
  // GA4: capture UTM params from the ad click + record the LP view
  // tagged with this specific LP's pageId so we can attribute by cluster.
  useEffect(() => {
    captureUtmParams();
    trackLandingPageView();
    // Note: a richer "lp_view" event with examId could be added to lib/ga4
    // once the analytics team confirms the event schema. For now,
    // pageId rides in trackCtaClick so cluster attribution works on conversion.
  }, []);

  const signupHref = `/login?exam=${exam}&utm_lp=${pageId}`;
  const handleCta = (loc: string) => trackCtaClick(`${pageId}-${loc}`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Sticky header — minimal: logo + single CTA */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="CipherExam home">
            <span className="text-lg font-bold tracking-tight text-brand-400">CipherExam</span>
          </Link>
          <Link
            to={signupHref}
            onClick={() => handleCta("header")}
            className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Start Free Trial
          </Link>
        </div>
      </header>

      <main>{children}</main>

      {/* Minimal footer — no main-site nav, just trust signals + final CTA */}
      <footer className="border-t border-slate-800 bg-slate-900 mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-lg font-semibold text-slate-100">Ready to train how {examShortName} actually thinks?</p>
            <Link
              to={signupHref}
              onClick={() => handleCta("footer")}
              className="inline-flex items-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-500"
            >
              Start Free Trial
            </Link>
            <p className="text-sm text-slate-400">7-day free trial · No credit card · Cancel anytime</p>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} CipherExam</p>
            <div className="flex gap-6">
              <Link to="/terms" className="hover:text-slate-300">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
              <Link to="/" className="hover:text-slate-300">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Shared atomic components for LP composition ----

export function Hero({
  eyebrow,
  h1,
  sub,
  ctaHref,
  onCtaClick,
  videoSrc,
  videoPoster,
  showMarkusBadge = true,
}: {
  eyebrow?: string;
  h1: string;
  sub: string;
  ctaHref: string;
  onCtaClick: () => void;
  /** Optional autoplay-muted-loop hero video. Served from /videos/lp/{exam}.mp4 */
  videoSrc?: string;
  /** Optional poster image shown before the video loads (and during prerender) */
  videoPoster?: string;
  /**
   * Whether to show the Markus Kopko (PMI AI Standards) trust pill below
   * the CTA. MUST be false on any PMI product LP (PMP, PgMP, etc.) — using
   * a PMI Standards Core Team member to endorse a PMI cert is a credibility
   * + conflict-of-interest problem. Keep true for Sec+ (CompTIA), SHRM-CP
   * (SHRM), and other non-PMI surfaces.
   */
  showMarkusBadge?: boolean;
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">{eyebrow}</p>
      )}
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl md:text-6xl">
        {h1}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-300 sm:text-xl">{sub}</p>

      {videoSrc && (
        <div className="mt-10 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-800 shadow-2xl shadow-brand-900/20 bg-slate-900">
          <video
            src={videoSrc}
            poster={videoPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="w-full h-auto block"
          />
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-2">
        <Link
          to={ctaHref}
          onClick={onCtaClick}
          className="inline-flex items-center rounded-md bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow transition hover:bg-brand-500"
        >
          Start Free Trial
        </Link>
        <p className="text-sm text-slate-400">Start your free 7-day trial. No credit card required.</p>
      </div>

      {/* Markus Kopko trust badge — non-PMI LPs only (Sec+, SHRM-CP).
          Suppressed on PMI product LPs (PMP) to avoid conflict-of-interest
          optics: he's on the PMI AI Standards Core Team. */}
      {showMarkusBadge && (
        <div className="mt-10 flex justify-center">
          <div className="group flex flex-col sm:flex-row items-center justify-center gap-3 rounded-full border border-slate-800 bg-slate-900/50 px-5 py-3 max-w-2xl">
            <div className="flex items-start gap-2">
              <span className="text-brand-400 text-xl leading-none">&ldquo;</span>
              <span className="text-sm text-slate-300 italic text-left">
                What you have built is differentiated by the coaching lens approach, the exam-specific reasoning frameworks, and the feedback loop you ran with real testers.
              </span>
              <span className="text-brand-400 text-xl leading-none">&rdquo;</span>
            </div>
            <span className="hidden sm:block text-slate-700">|</span>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              <span className="font-semibold text-slate-200">Markus Kopko, PgMP</span>
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> · </span>
              PMI AI Standards Core Team
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export function SectionBlock({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-3xl px-4 py-10 ${className}`}>
      {title && <h2 className="mb-4 text-2xl font-bold text-slate-50 sm:text-3xl">{title}</h2>}
      <div className="prose prose-lg prose-invert text-slate-300 prose-headings:text-slate-100 prose-strong:text-slate-100 prose-code:text-brand-300 prose-a:text-brand-400 hover:prose-a:text-brand-300 prose-li:marker:text-slate-500">{children}</div>
    </section>
  );
}

export function ExamLensCallout({ prompt, followUp }: { prompt: string; followUp: string }) {
  return (
    <aside className="mx-auto my-12 max-w-3xl rounded-2xl border border-brand-500/30 bg-brand-500/10 px-6 py-8 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-300">The Exam Lens</p>
      <p className="mt-3 text-2xl font-bold text-slate-50 sm:text-3xl">{prompt}</p>
      <p className="mt-3 text-base text-slate-300">{followUp}</p>
    </aside>
  );
}
