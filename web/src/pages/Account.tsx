import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    CreditCard, AlertTriangle, Loader2, ShieldCheck,
    Ticket, User, Receipt, Check,
} from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { auth } from '../firebase';
import { EXAMS } from '../config/exams';
import { REFUND_MAILTO, SUPPORT_EMAIL } from '../config/support';

/**
 * Account — the single place a paying customer can see what they bought, change
 * how they pay for it, stop paying for it, or ask for their money back.
 *
 * This exists because all of that used to live inside the *pricing* page, behind
 * an `isPro` check. Three things followed from that:
 *   - Users looked for "Account" and found a page selling them what they owned.
 *   - Exam Pass buyers (never `isPro`) had no billing surface at all.
 *   - The moment a subscription lapsed, `isPro` went false and the refund link
 *     vanished — exactly when someone is most likely to want a refund.
 *
 * So nothing here is gated on `isPro`. The page renders for every signed-in
 * user and adapts; the refund path is always reachable.
 */

interface SubscriptionDetails {
    status: string;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    planName: string;
    last4: string;
    brand: string;
    amount: number;
    interval: string;
    subscriptionId: string;
}

/**
 * Stripe epoch seconds → readable date, or null when we don't have one.
 *
 * Returning null matters: a missing timestamp used to fall through to
 * `new Date(0)` and render "December 31, 1969" as a confident-looking renewal
 * date. Better to omit the sentence than to state a wrong date about someone's
 * billing.
 */
function formatDate(timestamp: number | null | undefined): string | null {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) return null;
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export default function Account() {
    const { entitlement, passEntitlement } = useSubscription();
    const [details, setDetails] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const email = auth.currentUser?.email ?? '—';
    const hasActivePass = !!passEntitlement && passEntitlement.expiresAt.getTime() > Date.now();
    const passExamName = hasActivePass
        ? (EXAMS[passEntitlement!.examId]?.name ?? passEntitlement!.examId)
        : null;

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const getSubscriptionDetails = httpsCallable(getFunctions(), 'getSubscriptionDetails');
            const { data }: any = await getSubscriptionDetails();
            setDetails(data?.status && data.status !== 'none' ? data : null);
        } catch (err) {
            console.error('Failed to load subscription details:', err);
            setError('Could not load your billing details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetails(); }, []);

    const openPortal = async () => {
        setActionLoading(true);
        setPortalError(null);
        try {
            const createPortalSession = httpsCallable(getFunctions(), 'createPortalSession');
            const { data }: any = await createPortalSession();
            if (data?.url) {
                window.location.href = data.url;
                return;
            }
            setPortalError('The billing portal did not return a link. Please try again.');
        } catch (err: any) {
            // failed-precondition = this account has no Stripe customer record,
            // i.e. they have never paid. That is an expected state here, not a
            // fault — say so plainly instead of surfacing a raw error.
            const noCustomer = String(err?.code ?? '').includes('failed-precondition');
            setPortalError(
                noCustomer
                    ? "No billing portal for this account yet. If you bought an Exam Pass before August 2026, email support for a receipt — one-time purchases made then didn't create a billing record."
                    : 'Could not open the billing portal. Please try again.',
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!details?.subscriptionId) return;
        setActionLoading(true);
        try {
            const cancelSubscription = httpsCallable(getFunctions(), 'cancelSubscription');
            await cancelSubscription({ subscriptionId: details.subscriptionId });
            await fetchDetails();
            setShowCancelConfirm(false);
        } catch (err) {
            console.error('Cancellation failed:', err);
            setError(`Could not cancel your subscription. Email ${SUPPORT_EMAIL} and we'll do it for you.`);
        } finally {
            setActionLoading(false);
        }
    };

    // What the user actually has, in plain words.
    let planLabel = 'Starter (free)';
    let planNote = 'Upgrade any time — or buy a single Exam Pass.';
    if (details) {
        const periodEnd = formatDate(details.currentPeriodEnd);
        planLabel = details.planName;
        if (details.cancelAtPeriodEnd) {
            planNote = periodEnd
                ? `Access ends ${periodEnd}. You will not be charged again.`
                : 'Canceled — you will not be charged again.';
        } else {
            planNote = periodEnd
                ? `Renews ${periodEnd} at $${details.amount}/${details.interval}.`
                : `$${details.amount}/${details.interval}.`;
        }
    } else if (entitlement.plan === 'trial' && entitlement.isTrialExpired) {
        // The expired branch of getUserEntitlement keeps plan: 'trial' and only
        // drops accessLevel to 'free', so reading the plan alone told someone
        // whose trial ended last week that they were on a "Pro trial" and
        // printed an end date in the past.
        planLabel = 'Free';
        planNote = entitlement.trialEndsAt
            ? `Your Pro trial ended ${entitlement.trialEndsAt.toLocaleDateString()}. Upgrade any time to get Pro back.`
            : 'Your Pro trial has ended. Upgrade any time to get Pro back.';
    } else if (entitlement.plan === 'trial') {
        planLabel = 'Pro trial';
        planNote = entitlement.trialEndsAt
            ? `Trial ends ${entitlement.trialEndsAt.toLocaleDateString()}. No card on file yet.`
            : 'Trial active. No card on file yet.';
    }

    // This card and the Exam Pass card below it render independently — a
    // trial-ending date sitting right above a Pass-expiry date with nothing
    // linking them reads as "your access ends on the earlier one," which is
    // wrong: resolveProAccess (functions/src/entitlement.ts) checks paid,
    // then comped, then trial, then exam-pass last — so full access keeps
    // running on the Pass after the trial lapses, no re-purchase needed.
    // Only worth saying when the primary plan above isn't itself a durable
    // paid subscription; a real Pro subscriber doesn't need this caveat.
    if (hasActivePass && !details) {
        planNote += ` Your ${passExamName} Exam Pass keeps full access through ${passEntitlement!.expiresAt.toLocaleDateString()} either way.`;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white font-display">Account</h1>
                <p className="mt-1 text-slate-400 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" /> {email}
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Plan */}
            <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Your plan</h2>
                {loading ? (
                    <div className="flex items-center gap-3 text-slate-400 text-sm py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading your plan…
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="text-xl font-bold text-white">{planLabel}</p>
                                <p className="text-sm text-slate-400 mt-1">{planNote}</p>
                            </div>
                            {details && (
                                <span className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${details.cancelAtPeriodEnd
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'bg-green-500/10 text-green-500'}`}>
                                    {details.cancelAtPeriodEnd ? 'CANCELING' : 'ACTIVE'}
                                </span>
                            )}
                        </div>
                        {details && (
                            <div className="flex items-center gap-2 text-slate-300 text-sm mt-4 pt-4 border-t border-slate-700/60">
                                <CreditCard className="w-4 h-4 text-slate-500" />
                                <span className="capitalize">{details.brand} •••• {details.last4}</span>
                            </div>
                        )}
                        {!details && (
                            <Link
                                to="/app/pricing"
                                className="inline-block mt-4 text-sm font-semibold text-brand-400 hover:text-brand-300"
                            >
                                See plans →
                            </Link>
                        )}
                    </>
                )}
            </section>

            {/* Exam Pass — separate from the subscription; a pass holder is never isPro. */}
            {hasActivePass && (
                <section className="bg-slate-800/50 rounded-2xl border border-amber-500/30 p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Exam Pass</h2>
                    <div className="flex items-start gap-3">
                        <Ticket className="w-5 h-5 text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-white font-bold flex items-center gap-2">
                                {passExamName} <Check className="w-4 h-4 text-green-400" />
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                Full access through {passEntitlement!.expiresAt.toLocaleDateString()}. One-time
                                purchase — nothing to cancel, it simply ends.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Billing */}
            <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Billing</h2>
                <button
                    onClick={openPortal}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white rounded-xl transition-colors font-medium border border-slate-700"
                >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                    Invoices & payment method
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                    Opens your secure Stripe billing portal.
                </p>
                {portalError && (
                    <p className="text-xs text-amber-400/90 mt-3 text-center">{portalError}</p>
                )}

                {/* Cancel — only meaningful with a live subscription. */}
                {details && !details.cancelAtPeriodEnd && (
                    <div className="mt-4 pt-4 border-t border-slate-700/60">
                        {showCancelConfirm ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-red-500">Cancel your subscription?</p>
                                        <p className="text-xs text-red-400 mt-1">
                                            {formatDate(details.currentPeriodEnd)
                                                ? `You keep Pro access until ${formatDate(details.currentPeriodEnd)}, then move to the free Starter plan.`
                                                : 'You keep Pro access until the end of the period you have paid for, then move to the free Starter plan.'}{' '}
                                            You will not be charged again.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCancelConfirm(false)}
                                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Keep my plan
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                        Confirm cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="w-full text-sm text-red-400 hover:text-red-300 transition-colors py-2"
                            >
                                Cancel subscription
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Refunds — never gated. Someone asking for money back has often already
                lapsed, which is precisely when the old isPro-gated path disappeared. */}
            <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Refunds</h2>
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300 leading-relaxed">
                        <p className="font-semibold text-white">60-day money-back guarantee</p>
                        <p className="text-slate-400 mt-1">
                            Within 60 days of your first payment we'll refund every dollar — no conditions,
                            no proof of anything, no fine print.
                        </p>
                        <a
                            href={REFUND_MAILTO}
                            className="inline-block mt-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors font-semibold text-sm"
                        >
                            Request a refund
                        </a>
                    </div>
                </div>
            </section>

            <p className="text-xs text-slate-500 text-center pb-4">
                Questions about your account? Email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:text-brand-300">
                    {SUPPORT_EMAIL}
                </a>
            </p>
        </div>
    );
}
