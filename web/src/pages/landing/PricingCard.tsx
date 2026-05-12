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
      <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Simple, transparent pricing</h2>
      <p className="mt-3 text-center text-lg text-gray-600">
        Start free. Upgrade when you're ready to go all-in on exam prep.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Starter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-gray-900">$0</span>
            <span className="ml-1 text-sm font-semibold text-gray-500">/ forever</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Daily Quiz (5 Questions)</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Basic Progress Tracking</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Standard Explanations</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Community Exam Coverage</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Study Plan (Basic)</li>
          </ul>
          <Link
            to={signupHref}
            onClick={onCtaClick}
            className="mt-8 block w-full rounded-md border border-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Membership — POPULAR */}
        <div className="relative rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-md">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Popular
          </span>
          <h3 className="text-lg font-semibold text-gray-900">Pro Membership</h3>
          <p className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-gray-900">$19</span>
            <span className="ml-1 text-sm font-semibold text-gray-500">/ month</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">Yearly saves 17% — ~$189/yr</p>
          <p className="mt-3 text-sm font-semibold text-brand-700">7-day free trial. Cancel anytime.</p>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Unlimited AI Quizzes</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Detailed Domain Analytics</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Priority Support</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> Full Exam Simulators</li>
            <li className="flex gap-2"><Check className="h-5 w-5 flex-shrink-0 text-success-500" /> AI-Powered Study Plans</li>
          </ul>
          <Link
            to={signupHref}
            onClick={onCtaClick}
            className="mt-8 block w-full rounded-md bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Start Free Trial
          </Link>
          <p className="mt-3 text-center text-xs text-gray-500">
            Secure payments powered by Stripe. No credit card required for trial.
          </p>
        </div>
      </div>
    </section>
  );
}
