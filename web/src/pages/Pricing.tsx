import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
// Removed unused doc, onSnapshot, auth, db (except if needed for redirect, but window.location used here)
import { Check, ArrowLeft, Ticket } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExam } from '../contexts/ExamContext';
import { EXAMS, SELLABLE_EXAMS, isSellableExam } from '../config/exams';
import { REFUND_MAILTO } from '../config/support';

// Initialize Stripe with the publishable key
// Ideally this comes from env vars: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
// User will provide this key later
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

import { useMarketingCopy } from '../hooks/useMarketingCopy';
import { ConversionIntentService } from '../services/ConversionIntentService';
import { trackPricingView } from '../lib/ga4';

export default function Pricing() {
    const [loading, setLoading] = useState(false);
    const { entitlement, passEntitlement } = useSubscription();  // Use Context
    const isPro = entitlement.plan === 'pro';   // Only true if actually PAID Pro. Trial is not 'pro' plan.

    // --- 90-Day Exam Pass ---
    const { selectedExamId } = useExam();
    // A user sitting on a retired bank must not have it preselected as the exam
    // they're about to buy a pass for — fall back to the first sellable exam.
    const [passExamId, setPassExamId] = useState(
        isSellableExam(selectedExamId) ? selectedExamId : (SELLABLE_EXAMS[0]?.id ?? selectedExamId)
    );
    const [confirmingPass, setConfirmingPass] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const hasActivePass = !!passEntitlement && passEntitlement.expiresAt.getTime() > Date.now();
    const activePassExamName = hasActivePass
        ? (EXAMS[passEntitlement!.examId]?.name ?? 'your exam')
        : null;

    // EC-111: Track pricing page view as conversion intent + GA4
    useEffect(() => {
        if (!isPro) {
            ConversionIntentService.emit('pricing_view');
            trackPricingView();
        }
    }, [isPro]);

    // Login.tsx redirects here with ?intent=exam-pass after signup/signin for
    // anyone who clicked "Get the Exam Pass" on an LP — that click used to be
    // indistinguishable from "Start Free Trial" by the time auth completed, so
    // it landed everyone on the generic dashboard and the Pass intent was lost.
    // Auto-opening the confirm step (and scrolling to it) finishes the click
    // they already made instead of asking them to find the card and click twice.
    const [searchParams] = useSearchParams();
    const examPassCardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (searchParams.get('intent') !== 'exam-pass') return;
        if (hasActivePass || isPro) return;
        setConfirmingPass(true);
        examPassCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, hasActivePass, isPro]);

    const navigate = useNavigate();
    const functions = getFunctions();
    const copy = useMarketingCopy();

    // Removed manual useEffect listener


    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const { data }: any = await createCheckoutSession({ billingInterval: 'month' });

            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error("No checkout URL returned");
                alert("Failed to start checkout. Please try again.");
            }
        } catch (error: any) {
            console.error("Checkout failed:", error);
            alert(`Checkout failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePassCheckout = async () => {
        setPassLoading(true);
        try {
            const createPassCheckoutSession = httpsCallable(functions, 'createPassCheckoutSession');
            const { data }: any = await createPassCheckoutSession({ examId: passExamId });

            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error("No checkout URL returned");
                alert("Failed to start checkout. Please try again.");
            }
        } catch (error: any) {
            console.error("Pass checkout failed:", error);
            alert(`Checkout failed: ${error.message}`);
        } finally {
            setPassLoading(false);
        }
    };

    // Billing lives on /app/account now — status, invoices, cancellation and
    // refunds in one place, reachable from the sidebar and not gated on isPro.
    // This page's job is selling; it should not also be the place you go to stop
    // paying. Two cancel paths that could silently diverge is worse than one.
    const handleManageSubscription = () => {
        navigate('/app/account');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-20 px-4">
            <div className="max-w-4xl w-full text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
                    {copy.pro_value_primary}
                </h1>

                {/* Back Button */}
                <button
                    onClick={() => window.location.href = '/app'}
                    className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    {copy.pro_value_secondary}
                </p>

                {/* Pro is monthly-only. The non-renewing $59 / 90-day Exam Pass
                    below is the alternative to a subscription — there is no
                    annual plan, so there is no billing-interval toggle. */}
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                {/* Free Tier — the free floor, sorts last */}
                <div className="order-3 bg-slate-800/50 rounded-3xl p-8 border border-slate-700 flex flex-col">
                    <h3 className="text-2xl font-bold text-white">Starter</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold tracking-tight text-white">$0</span>
                        <span className="ml-1 text-xl text-slate-400">/ forever</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        {['Daily Quiz (5 Questions)', 'Basic Progress Tracking', 'Standard Explanations'].map((feat) => (
                            <li key={feat} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-slate-500" />
                                <span className="text-slate-300">{feat}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        className={`mt-8 w-full py-4 rounded-xl font-bold transition-colors cursor-not-allowed ${!isPro ? 'bg-slate-700 text-slate-300' : 'bg-transparent text-slate-500 border border-slate-700 hover:border-slate-600 hover:text-slate-400 cursor-pointer'
                            }`}
                        disabled={!isPro}
                        onClick={() => {
                            if (isPro) {
                                handleManageSubscription();
                            }
                        }}
                    >
                        {!isPro ? 'Current Plan' : 'Manage Subscription'}
                    </button>
                </div>

                {/* Pro Tier — subscription option, second per the pricing decision
                    (cipher-marketing/19-revenue-plan-2026-08.md §3: "the $59 Exam
                    Pass is the primary offer... Pro is the visible second option").
                    Demoted from its former emphasized/POPULAR treatment, which
                    contradicted that decision. */}
                <div className={`order-2 rounded-3xl p-8 border ${isPro ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-green-500/50 ring-2 ring-green-500/20' : 'bg-slate-800/50 border-slate-700'} flex flex-col relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white">Pro Membership</h3>
                            {isPro && (
                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ACTIVE
                                </span>
                            )}
                        </div>
                        <div className="mt-4 flex items-baseline">
                            <span className="text-4xl font-bold tracking-tight text-white">$19</span>
                            <span className="ml-1 text-xl text-slate-400">/ month</span>
                        </div>
                        <p className="mt-2 text-blue-200 text-sm">{isPro ? 'Your plan renews automatically.' : 'Cancel anytime.'}</p>

                        <ul className="mt-8 space-y-4 mb-8">
                            {[
                                'Unlimited AI Quizzes',
                                'Detailed Domain Analytics',
                                'Priority Support',
                                'PMP Exam Simulators',
                                'Visual Mnemonics (DALL-E 2)'
                            ].map((feat) => (
                                <li key={feat} className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-1 rounded-full">
                                        <Check className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="text-white font-medium">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={isPro ? handleManageSubscription : handleSubscribe}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 ${isPro
                                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 cursor-pointer'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 hover:shadow-blue-500/25'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : isPro ? (
                                'Manage Subscription'
                            ) : (
                                'Upgrade to Pro'
                            )}
                        </button>
                    </div>
                </div>

                {/* 90-Day Exam Pass — primary offer, first per the pricing decision.
                    examPassCardRef is the scroll target when someone arrives via
                    ?intent=exam-pass (LP "Get the Exam Pass" click, threaded
                    through Login.tsx). */}
                <div
                    ref={examPassCardRef}
                    className={`order-1 rounded-3xl p-8 border-2 flex flex-col relative overflow-hidden ${hasActivePass ? 'bg-slate-800/50 border-green-500/50 ring-2 ring-green-500/20' : 'bg-gradient-to-br from-amber-900/20 to-slate-900 border-amber-500/60 shadow-2xl shadow-amber-900/20'}`}
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-amber-400" />
                            Exam Pass
                        </h3>
                        {hasActivePass ? (
                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> ACTIVE
                            </span>
                        ) : (
                            <span className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>
                        )}
                    </div>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold tracking-tight text-white">$59</span>
                        <span className="ml-1 text-xl text-slate-400">/ one-time</span>
                    </div>
                    <p className="mt-2 text-amber-200/80 text-sm">90 days. One exam. No auto-renew.</p>

                    <ul className="mt-8 space-y-4 flex-1">
                        {[
                            'Everything in Pro for one exam',
                            '90 days of full access',
                            'One-time payment — never renews',
                            'Rescheduled? Your pass moves with your exam.'
                        ].map((feat) => (
                            <li key={feat} className="flex items-center gap-3">
                                <div className="bg-amber-500/20 p-1 rounded-full">
                                    <Check className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-slate-300">{feat}</span>
                            </li>
                        ))}
                    </ul>

                    {hasActivePass ? (
                        <div className="mt-8 space-y-2">
                            <div className="w-full py-4 rounded-xl font-bold text-center bg-green-600/20 text-green-400 border border-green-500/30">
                                Pass Active — {activePassExamName}
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                                Ends {passEntitlement!.expiresAt.toLocaleDateString()}
                            </p>
                            {/* Kept alongside the Account page: a pass holder looking at their
                                own active pass is exactly where a refund question occurs. */}
                            <p className="text-xs text-slate-500 text-center pt-1">
                                <a
                                    href={REFUND_MAILTO}
                                    className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2"
                                >
                                    Request a refund
                                </a>{' '}
                                — 60-day guarantee, no conditions.
                            </p>
                        </div>
                    ) : isPro ? (
                        <div className="mt-8 w-full py-4 rounded-xl font-bold text-center bg-slate-700/50 text-slate-400 border border-slate-700">
                            Included with your Pro plan
                        </div>
                    ) : (
                        <div className="mt-8 space-y-3">
                            <label className="block text-left">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your exam</span>
                                <select
                                    value={passExamId}
                                    onChange={(e) => { setPassExamId(e.target.value); setConfirmingPass(false); }}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {SELLABLE_EXAMS.map((exam) => (
                                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                                    ))}
                                </select>
                            </label>

                            {confirmingPass ? (
                                <>
                                    <p className="text-sm text-amber-300 text-left">
                                        Your pass covers <span className="font-bold">{EXAMS[passExamId]?.name ?? 'this exam'}</span> only. Correct?
                                    </p>
                                    <button
                                        onClick={handlePassCheckout}
                                        disabled={passLoading}
                                        className="w-full py-4 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-500/25"
                                    >
                                        {passLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm & Checkout — $59'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setConfirmingPass(false)}
                                        disabled={passLoading}
                                        className="w-full py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Change exam
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setConfirmingPass(true)}
                                    className="w-full py-4 rounded-xl font-bold transition-all bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20"
                                >
                                    Get Exam Pass
                                </button>
                            )}
                            <p className="text-xs text-slate-500 text-left">
                                Standard 60-day money-back guarantee — full refund, no conditions.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-12 text-slate-500 text-sm">
                Secure payments powered by <span className="text-slate-400 font-bold">Stripe</span>.
                Payments are encrypted and secure.
            </p>
        </div>
    );
}
