import { Link } from "react-router-dom";
import { Check, Ticket } from "lucide-react";

/**
 * Tier 1 LP pricing card — byte-for-byte from the verified live /pricing
 * page as of 2026-05-11. If pricing changes on /pricing, update this
 * component in lock-step. Source of truth: ../Pricing.tsx + the verified
 * record in the cipher-marketing repo's cipher-exam-context skill.
 *
 * Card order and CTA intent — 2026-08-12: reordered Exam Pass first and
 * moved the emphasized-card styling onto it. The locked pricing decision
 * (cipher-marketing/19-revenue-plan-2026-08.md, section 3) is "the $59
 * Exam Pass is the primary offer... Pro is the visible second option" —
 * this card had Pro visually leading (POPULAR badge, emphasized border)
 * with Exam Pass in the last slot, the opposite of the decision.
 *
 * Also: all three CTAs used to link to the identical signupHref, so
 * clicking "Get the Exam Pass" was indistinguishable from "Start Free
 * Trial" by the time the visitor hit /login — intent was lost at the
 * door. The Exam Pass link now carries `&intent=exam-pass`, which
 * Login.tsx reads to redirect straight to /app/pricing (pre-selecting
 * the exam already carried in signupHref) instead of the generic
 * dashboard, and Pricing.tsx auto-opens the checkout confirmation there.
 */
export default function PricingCard({
  signupHref,
  onCtaClick,
}: {
  signupHref: string;
  onCtaClick: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16" id="pricing">
      <h2 className="text-center text-3xl font-bold text-slate-50 sm:text-4xl">Simple, transparent pricing</h2>
      <p className="mt-3 text-center text-lg text-slate-400">
        Start free. Upgrade when you're ready to go all-in on exam prep.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 90-Day Exam Pass — the primary offer. LP traffic is exam-date-driven
            (someone downloading a cert-specific cheat sheet has a sit date),
            which is exactly what a defined-endpoint pass matches better than
            an open-ended subscription. See the pricing decision doc for the
            full reasoning. */}
        <div className="relative rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-8 shadow-2xl shadow-amber-900/30">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
            Recommended
          </span>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Ticket className="h-5 w-5 text-amber-400" /> Exam Pass
          </h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-slate-50">$59</span>
            <span className="ml-1 text-sm font-semibold text-slate-500">/ one-time</span>
          </p>
          <p className="mt-3 text-sm font-semibold text-amber-300">90 days. One exam. No auto-renew.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-amber-400" /> Everything in Pro for one exam</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-amber-400" /> 90 days of full access</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-amber-400" /> One-time payment — never renews</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-amber-400" /> Rescheduled? Your pass moves with your exam.</li>
          </ul>
          <Link
            to={`${signupHref}&intent=exam-pass`}
            onClick={onCtaClick}
            className="mt-8 block w-full rounded-md bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 shadow transition hover:bg-amber-400"
          >
            Get the Exam Pass
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Buy after you sign up — no subscription required.
          </p>
        </div>

        {/* Pro Membership */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100">Pro Membership</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-slate-50">$19</span>
            <span className="ml-1 text-sm font-semibold text-slate-500">/ month</span>
          </p>
          <p className="mt-3 text-sm font-semibold text-brand-300">14-day free trial. Cancel anytime.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Unlimited AI Quizzes</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Detailed Domain Analytics</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Priority Support</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Full Exam Simulators</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> AI-Powered Study Plans</li>
          </ul>
          <Link
            to={signupHref}
            onClick={onCtaClick}
            className="mt-8 block w-full rounded-md border border-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-brand-300 transition hover:bg-brand-500/10 hover:text-brand-200"
          >
            Start Free Trial
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Secure payments powered by Stripe. No credit card required for trial.
          </p>
        </div>

        {/* Starter — the free floor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg sm:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-100">Starter</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-slate-50">$0</span>
            <span className="ml-1 text-sm font-semibold text-slate-500">/ forever</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Daily Quiz (20/day your first week, then 5)</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Basic Progress Tracking</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Standard Explanations</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Community Exam Coverage</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Study Plan (Basic)</li>
          </ul>
          <Link
            to={signupHref}
            onClick={onCtaClick}
            className="mt-8 block w-full rounded-md border border-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-brand-300 transition hover:bg-brand-500/10 hover:text-brand-200"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  );
}
