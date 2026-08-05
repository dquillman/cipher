import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
// Removed unused doc, onSnapshot, auth, db (except if needed for redirect, but window.location used here)
import { Check, ArrowLeft, Ticket } from 'lucide-react';
import SubscriptionModal from '../components/SubscriptionModal';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExam } from '../contexts/ExamContext';
import { EXAMS } from '../config/exams';

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
    const [passExamId, setPassExamId] = useState(selectedExamId);
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

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
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

    const handleManageSubscription = () => {
        setIsSubModalOpen(true);
    };

    const redirectToStripePortal = async () => {
        setLoading(true);
        try {
            const createPortalSession = httpsCallable(functions, 'createPortalSession');
            const { data }: any = await createPortalSession();

            if (data?.url) {
                window.location.href = data.url;
            } else {
                console.error("No portal URL returned");
                alert("Failed to redirect to billing portal.");
            }
        } catch (error: any) {
            console.error("Portal redirect failed:", error);
            alert(`Failed to load billing portal: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-20 px-4">
            <SubscriptionModal
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
                onManageBillingFromStripe={redirectToStripePortal}
            />

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
                {/* Free Tier */}
                <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 flex flex-col">
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

                {/* Pro Tier */}
                <div className={`bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl p-8 border ${isPro ? 'border-green-500/50 ring-2 ring-green-500/20' : 'border-blue-500/30'} flex flex-col relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white">Pro Membership</h3>
                            {isPro ? (
                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ACTIVE
                                </span>
                            ) : (
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
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

                {/* 90-Day Exam Pass */}
                <div className={`bg-slate-800/50 rounded-3xl p-8 border ${hasActivePass ? 'border-green-500/50 ring-2 ring-green-500/20' : 'border-amber-500/30'} flex flex-col relative overflow-hidden`}>
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
                            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">NO SUBSCRIPTION</span>
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
                                    {Object.values(EXAMS).map((exam) => (
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
