import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { trackPricingView, trackCtaClick } from '../lib/ga4';
import { useEffect } from 'react';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import { SEO } from '../config/seo';

export default function PublicPricing() {
    const navigate = useNavigate();
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

    useEffect(() => { trackPricingView(); }, []);

    const handleCta = () => {
        trackCtaClick('pricing');
        navigate('/login?mode=signup');
    };

    return (
        <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
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

                    {/* Billing Toggle */}
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <span className={`text-sm font-medium ${billingInterval === 'month' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                            className="relative w-14 h-8 bg-slate-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            <div
                                className={`absolute left-1 top-1 w-6 h-6 bg-brand-500 rounded-full transition-transform ${billingInterval === 'year' ? 'translate-x-6' : 'translate-x-0'}`}
                            />
                        </button>
                        <span className={`text-sm font-medium flex items-center gap-2 ${billingInterval === 'year' ? 'text-white' : 'text-slate-400'}`}>
                            Yearly
                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">SAVE 17%</span>
                        </span>
                    </div>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
                    {/* Free Tier */}
                    <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 flex flex-col">
                        <h3 className="text-2xl font-bold text-white">Starter</h3>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-bold tracking-tight text-white">$0</span>
                            <span className="ml-1 text-xl text-slate-400">/ forever</span>
                        </div>
                        <ul className="mt-8 space-y-4 flex-1">
                            {['Daily Quiz (5 Questions)', 'Basic Progress Tracking', 'Standard Explanations', 'Community Exam Coverage', 'Study Plan (Basic)'].map((feat) => (
                                <li key={feat} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-slate-500" />
                                    <span className="text-slate-300">{feat}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleCta}
                            className="mt-8 w-full py-4 rounded-xl font-bold transition-colors bg-slate-700 text-white hover:bg-slate-600"
                        >
                            Get Started Free
                        </button>
                        <p className="mt-3 text-xs text-slate-500 text-center">Want unlimited practice? <span className="text-brand-400">See Pro</span></p>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl p-8 border border-brand-500/30 flex flex-col relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white">Pro Membership</h3>
                                <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
                            </div>
                            <div className="mt-4 flex items-baseline flex-wrap gap-x-2">
                                {billingInterval === 'year' && (
                                    <span className="text-lg text-slate-500 line-through">$228</span>
                                )}
                                <span className="text-4xl font-bold tracking-tight text-white">
                                    ${billingInterval === 'month' ? '19' : '190'}
                                </span>
                                <span className="text-xl text-slate-400">
                                    / {billingInterval === 'month' ? 'month' : 'year'}
                                </span>
                                {billingInterval === 'year' && (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Save $38/yr</span>
                                )}
                            </div>
                            {billingInterval === 'year' && (
                                <p className="text-xs text-slate-500">$15.83/mo billed annually</p>
                            )}
                            <p className="mt-2 text-brand-200 text-sm">7-day free trial. Cancel anytime.</p>

                            <ul className="mt-8 space-y-4 mb-8">
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
                                onClick={handleCta}
                                className="w-full py-4 rounded-xl font-bold transition-all shadow-lg bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:from-brand-400 hover:to-purple-500 hover:shadow-brand-500/25"
                            >
                                Start Free Trial
                            </button>
                        </div>
                    </div>
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
                            <dt className="text-lg font-semibold text-white mb-2">Which certifications are included?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                PMP, Certified ScrumMaster (CSM), SHRM-CP, Six Sigma Green Belt, Certified Payroll Professional (CPP), CIA Part 1, ITIL 4 Foundation, CompTIA Security+, CompTIA Network+, CompTIA A+ Core 2, and PgMP. CISSP and AWS SAA are coming soon. Every cert is included in Pro at no extra cost.
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6">
                            <dt className="text-lg font-semibold text-white mb-2">How is CipherExam different from other prep tools?</dt>
                            <dd className="text-slate-300 leading-relaxed">
                                Every question is classified by Bloom's Taxonomy and explained through an exam-specific reasoning framework called <a href="/exam-lens" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">Exam Lens</a>. You learn <em>how the exam thinks</em>, not just the answer. Memorizing question banks plateaus around 70% — reasoning-based prep scales past it.
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>

            <PublicFooter />
        </div>
    );
}
