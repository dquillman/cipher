import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
// Removed unused doc, onSnapshot, auth, db (except if needed for redirect, but window.location used here)
import { Check, ArrowLeft } from 'lucide-react';
import SubscriptionModal from '../components/SubscriptionModal';
import { useSubscription } from '../contexts/SubscriptionContext';

// Initialize Stripe with the publishable key
// Ideally this comes from env vars: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
// User will provide this key later
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

import { useMarketingCopy } from '../hooks/useMarketingCopy';
import { ConversionIntentService } from '../services/ConversionIntentService';
import { trackPricingView } from '../lib/ga4';

export default function Pricing() {
    const [loading, setLoading] = useState(false);
    const { entitlement } = useSubscription();  // Use Context
    const isPro = entitlement.plan === 'pro';   // Only true if actually PAID Pro. Trial is not 'pro' plan.

    // EC-111: Track pricing page view as conversion intent + GA4
    useEffect(() => {
        if (!isPro) {
            ConversionIntentService.emit('pricing_view');
            trackPricingView();
        }
    }, [isPro]);

    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const functions = getFunctions();
    const copy = useMarketingCopy();

    // Both IDs must belong to the SAME Stripe account/mode as the
    // STRIPE_SECRET_KEY deployed with the Cloud Functions (functions/.env).
    // Currently that key is TEST-mode (acct_1ScUyKPISVVFkTmY), so these are
    // that account's test prices ($19/mo, $190/yr on prod_TZeN9wLRQuhpSi).
    // GOING LIVE: swap the functions STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
    // to live-mode values AND replace both IDs with live-mode prices in the
    // same change — a mixed pair makes checkout fail with "No such price".
    const PRICE_ID_MONTHLY = "price_1ScV4PPISVVFkTmYtxipM6eN";
    const PRICE_ID_YEARLY = "price_1ScXMIPISVVFkTmY9U5uaLTk";

    // Removed manual useEffect listener


    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const priceId = billingInterval === 'month' ? PRICE_ID_MONTHLY : PRICE_ID_YEARLY;

            const { data }: any = await createCheckoutSession({
                priceId: priceId,
                successUrl: window.location.origin + '/success',
                cancelUrl: window.location.origin + '/pricing',
            });

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

    const handleManageSubscription = () => {
        setIsSubModalOpen(true);
    };

    const redirectToStripePortal = async () => {
        setLoading(true);
        try {
            const createPortalSession = httpsCallable(functions, 'createPortalSession');
            const { data }: any = await createPortalSession({
                returnUrl: window.location.origin + '/pricing',
            });

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

                {/* Billing Toggle */}
                <div className="mt-8 flex justify-center items-center gap-4">
                    <span className={`text-sm font-medium ${billingInterval === 'month' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                        className="relative w-14 h-8 bg-slate-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <div
                            className={`absolute left-1 top-1 w-6 h-6 bg-blue-500 rounded-full transition-transform ${billingInterval === 'year' ? 'translate-x-6' : 'translate-x-0'
                                }`}
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
                            <span className="text-4xl font-bold tracking-tight text-white">
                                ${billingInterval === 'month' ? '19' : '190'}
                            </span>
                            <span className="ml-1 text-xl text-slate-400">
                                / {billingInterval === 'month' ? 'month' : 'year'}
                            </span>
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
            </div>

            <p className="mt-12 text-slate-500 text-sm">
                Secure payments powered by <span className="text-slate-400 font-bold">Stripe</span>.
                Payments are encrypted and secure.
            </p>
        </div>
    );
}
