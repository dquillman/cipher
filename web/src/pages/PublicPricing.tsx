import { useNavigate } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../config/support';
import { Check, ShieldCheck } from 'lucide-react';
import { trackPricingView, trackCtaClick } from '../lib/ga4';
import { useEffect } from 'react';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import GuaranteeSeal from '../components/GuaranteeSeal';
import { SEO } from '../config/seo';

export default function PublicPricing() {
    const navigate = useNavigate();

    useEffect(() => { trackPricingView(); }, []);

    // intent is optional: only the Exam Pass button passes 'exam-pass', which
    // Login.tsx reads to redirect straight into the pass-checkout flow on
    // /app/pricing instead of the generic dashboard. Starter/Pro don't need
    // it — the free tier and the trial both land correctly on /app already.
    const handleCta = (intent?: string) => {
        trackCtaClick('pricing');
        navigate(`/login?mode=signup${intent ? `&intent=${intent}` : ''}`);
    };

    return (
        <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
            <SeoHead {...SEO.pricing} />
            <PublicNav />

            {/* Pricing Content */}
            <div className="pt-28 pb-20 flex flex-col items-center px-4">
                <div className="max-w-4xl w-full text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold font-display text-white">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Start free. Upgrade when you're ready to go all-in on exam prep.
                    </p>

                    {/* Pro is monthly-only. The non-renewing $59 / 90-day Exam
                        Pass is the alternative to subscribing, so there is no
                        billing-interval toggle. */}
                </div>

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl w-full items-start">
                    {/* Free Tier */}
                    <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 flex flex-col">
                        <h3 className="text-2xl font-bold text-white">Starter</h3>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-bold tracking-tight text-white">$0</span>
                            <span className="ml-1 text-xl text-slate-400">/ forever</span>
                        </div>
                        <ul className="mt-8 space-y-4 flex-1">
                            {['Daily Quiz (5 Questions)', 'Basic Progress Tracking', 'Standard Explanations', 'Community Exam Coverage', 'Study Plan (Basic)', 'Dark & Daylight study modes'].map((feat) => (
                                <li key={feat} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-slate-500" />
                                    <span className="text-slate-300">{feat}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleCta()}
                            className="mt-8 w-full py-4 rounded-xl font-bold transition-colors bg-slate-700 text-white hover:bg-slate-600"
                        >
                            Get Started Free
                        </button>
                        <p className="mt-3 text-xs text-slate-500 text-center">Want unlimited practice? <span className="text-brand-400">See the Exam Pass</span></p>
                    </div>

                    {/* Exam Pass — the hero plan. Flat $59 one-time for 90 days; ignores the
                        billing toggle (it's not a subscription). Priced at parity with 3 months
                        of Pro ($57) but one-time — the "no subscription trap" play. */}
                    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl p-8 border border-brand-500/40 ring-1 ring-brand-500/30 flex flex-col relative group lg:-mt-4 lg:pb-12">
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* MOST POPULAR tag — centered on the top border so the seal owns the corner */}
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">MOST POPULAR</span>
                        {/* Gold guarantee sticker — inside the card, clear of all copy */}
                        <GuaranteeSeal
                            size={116}
                            tilt={-12}
                            animate
                            className="hidden lg:block absolute top-6 right-6 z-10 pointer-events-none"
                        />

                        <div className="relative">
                            <h3 className="text-2xl font-bold text-white lg:pr-32">Exam Pass</h3>
                            <div className="mt-4 flex items-baseline flex-wrap gap-x-2 lg:pr-32">
                                <span className="text-4xl font-bold tracking-tight text-white">$59</span>
                                <span className="text-xl text-slate-400">one-time</span>
                            </div>
                            <p className="text-xs text-slate-500">90 days of full access — no subscription</p>
                            <p className="mt-2 text-brand-200 text-sm">Pay once, pass, done.</p>
                            <p className="mt-1.5 text-xs text-slate-400">About the same as 3 months of Pro ($57) — but one-time, with nothing to cancel.</p>

                            <ul className="mt-8 space-y-4 mb-8">
                                {[
                                    'Everything in Pro Membership',
                                    '90 days of full access',
                                    'One-time payment — no auto-renew',
                                    'Free reschedule if your exam date moves',
                                    'Unlimited AI quizzes & full simulators'
                                ].map((feat) => (
                                    <li key={feat} className="flex items-center gap-3">
                                        <div className="bg-brand-500/20 p-1 rounded-full">
                                            <Check className="w-4 h-4 text-brand-400" />
                                        </div>
                                        <span className="text-white font-medium">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCta('exam-pass')}
                                className="w-full py-4 rounded-xl font-bold transition-all shadow-lg bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:from-brand-400 hover:to-purple-500 hover:shadow-brand-500/25"
                            >
                                Get the Exam Pass
                            </button>
                            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-300">
                                <ShieldCheck className="w-4 h-4" /> 60-day money-back guarantee — full refund, no conditions
                            </p>
                        </div>
                    </div>

                    {/* Pro Tier — the subscription option, demoted below the Exam Pass hero. */}
                    <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 flex flex-col">
                        <h3 className="text-2xl font-bold text-white">Pro Membership</h3>
                        <div className="mt-4 flex items-baseline flex-wrap gap-x-2">
                            <span className="text-4xl font-bold tracking-tight text-white">$19</span>
                            <span className="text-xl text-slate-400">/ month</span>
                        </div>
                        <p className="mt-2 text-brand-200 text-sm">7-day free trial. Cancel anytime.</p>
                        <p className="mt-1.5 text-xs text-slate-400">Best if you're studying long-term or across multiple certs.</p>

                        <ul className="mt-8 space-y-4 mb-8 flex-1">
                            {[
                                'Unlimited AI Quizzes',
                                'Detailed Domain Analytics',
                                'Priority Support',
                                'Full Exam Simulators',
                                'AI-Powered Study Plans'
                            ].map((feat) => (
                                <li key={feat} className="flex items-center gap-3">
                                    <div className="bg-brand-500/20 p-1 rounded-full">
                                        <Check className="w-4 h-4 text-brand-400" />
                                    </div>
                                    <span className="text-white font-medium">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleCta()}
                            className="w-full py-4 rounded-xl font-bold transition-colors bg-slate-700 text-white hover:bg-slate-600"
                        >
                            Start Free Trial
                        </button>
                        <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-300">
                            <ShieldCheck className="w-4 h-4" /> 60-day money-back guarantee
                        </p>
                    </div>
                </div>

                {/* Risk-free band — makes the guarantee unmissable, sticker + copy. */}
                <div className="mt-14 w-full max-w-3xl rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-amber-900/[0.04] px-8 py-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <GuaranteeSeal size={128} tilt={-8} animate className="shrink-0" />
                    <div>
                        <h2 className="text-2xl font-bold text-white font-display">Love it, or your money back.</h2>
                        <p className="mt-2 text-slate-300 leading-relaxed">
                            Use CipherExam Pro for up to <span className="text-amber-300 font-semibold">60 days</span>. Not for you?
                            Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-300 font-semibold underline underline-offset-2 hover:text-amber-200">{SUPPORT_EMAIL}</a> within
                            60 days of your first payment and we'll refund every dollar you've paid — <span className="text-white font-semibold">no
                            conditions, no proof of anything, no fine print.</span>
                        </p>
                    </div>
                </div>

                {/* "Built to be canceled" — answers subscription fatigue head-on.
                    Companion to the guarantee band: zero risk in, zero trap out. */}
                <div className="mt-6 w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-800/30 px-8 py-8 text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-white font-display">Built to be canceled.</h2>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                        This isn't another forever-subscription. Most students study for
                        <span className="text-brand-300 font-semibold"> 2–3 months</span>, pass, and cancel — about
                        <span className="text-white font-semibold"> $38–57 total</span>. Cancel in two clicks from your
                        account settings, keep access through the end of your billing period, and the 60-day guarantee
                        sits under all of it. Passing your exam and leaving is the outcome we built for.
                    </p>
                </div>

                <p className="mt-12 text-slate-500 text-sm">
                    Secure payments powered by <span className="text-slate-400 font-bold">Stripe</span>.
                    No credit card required for trial.
                </p>

                {/* Frequently Asked Questions — content mirrors the FAQPage schema in seo.ts.
                    Keep these two in sync: Google penalizes schema/visible-content mismatches. */}
                <section className="mt-20 w-full max-w-3xl" aria-labelledby="pricing-faq">
                    <h2 id="pricing-faq" className="text-2xl sm:text-3xl font-bold text-white font-display text-center mb-8">
                        Frequently asked questions
                    </h2>
                    <dl className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">Is there a free trial?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                Yes. CipherExam Pro includes a 7-day free trial. No credit card required to start. You'll only be charged if you choose to continue after the trial.
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                Yes. You can cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period — no questions asked.
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">What's the money-back guarantee?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                Use CipherExam Pro for up to 60 days. Not for you? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:text-brand-300 underline underline-offset-2">{SUPPORT_EMAIL}</a> within 60 days of your first payment and we'll refund every dollar you've paid — no conditions, no proof of anything, no fine print.
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">Which certifications are included?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                Four: PMP (built to PMI's July 2026 Exam Content Outline), CompTIA Security+ (SY0-701), CompTIA Network+ (N10-009), and CompTIA A+ Core 2 (220-1202). All four are included at every paid tier at no extra cost. We used to list eleven and have deliberately cut back — a bank that cannot fill more than one full-length mock is not worth selling, and we would rather go deep on four.
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">How is CipherExam different from other prep tools?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                All 579 questions across all four exams are classified by Bloom's Taxonomy, and every answer is explained through an exam-specific reasoning framework called <a href="/exam-lens" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">Exam Lens</a>. You learn <em>how the exam thinks</em>, not just the answer. Your results break accuracy out by reasoning level, so you can see whether you are missing recall questions or judgment questions — they need different fixes.
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>

            <PublicFooter />
        </div>
    );
}
