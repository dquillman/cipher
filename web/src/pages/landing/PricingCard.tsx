import { Link } from "react-router-dom";
import { Check } from "lucide-react";

/**
 * Tier 1 LP pricing card — byte-for-byte from the verified live /pricing
 * page as of 2026-05-11. If pricing changes on /pricing, update this
 * component in lock-step. Source of truth: ../Pricing.tsx + the verified
 * record in the cipher-marketing repo's cipher-exam-context skill.
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

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Starter */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100">Starter</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-slate-50">$0</span>
            <span className="ml-1 text-sm font-semibold text-slate-500">/ forever</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-emerald-400" /> Daily Quiz (5 Questions)</li>
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

        {/* Pro Membership — POPULAR */}
        <div className="relative rounded-2xl border-2 border-brand-500 bg-slate-900 p-8 shadow-2xl shadow-brand-900/30">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
            Popular
          </span>
          <h3 className="text-lg font-semibold text-slate-100">Pro Membership</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-slate-50">$19</span>
            <span className="ml-1 text-sm font-semibold text-slate-500">/ month</span>
          </p>
          <p className="mt-3 text-sm font-semibold text-brand-300">7-day free trial. Cancel anytime.</p>
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
            className="mt-8 block w-full rounded-md bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow transition hover:bg-brand-500"
          >
            Start Free Trial
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Secure payments powered by Stripe. No credit card required for trial.
          </p>
        </div>
      </div>
    </section>
  );
}
