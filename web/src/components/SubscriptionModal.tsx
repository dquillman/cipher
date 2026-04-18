import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { X, CreditCard, Calendar, AlertTriangle, Loader2 } from 'lucide-react';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onManageBillingFromStripe: () => void; // Fallback to Stripe Portal
}

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

export default function SubscriptionModal({ isOpen, onClose, onManageBillingFromStripe }: SubscriptionModalProps) {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [details, setDetails] = useState<SubscriptionDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDetails();
        } else {
            // Reset state on close
            setDetails(null);
            setLoading(true);
            setError(null);
            setShowCancelConfirm(false);
        }
    }, [isOpen]);

    const fetchDetails = async () => {
        try {
            const functions = getFunctions();
            const getSubscriptionDetails = httpsCallable(functions, 'getSubscriptionDetails');
            const { data }: any = await getSubscriptionDetails();
            setDetails(data);
        } catch (err: any) {
            console.error("Failed to fetch subscription:", err);
            setError("Unable to load subscription details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!details?.subscriptionId) return;

        setActionLoading(true);
        try {
            const functions = getFunctions();
            const cancelSubscription = httpsCallable(functions, 'cancelSubscription');

            await cancelSubscription({ subscriptionId: details.subscriptionId });

            // Refresh details to show "Canceling at period end" status
            await fetchDetails();
            setShowCancelConfirm(false);
        } catch (err: any) {
            console.error("Cancellation failed:", err);
            setError("Failed to cancel subscription. Please contact support.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white font-display">Manage Subscription</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                            <p className="text-slate-400 text-sm">Loading subscription details...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-4 text-sm">
                                {error}
                            </div>
                            <button onClick={fetchDetails} className="text-brand-400 hover:text-brand-300 text-sm font-medium">
                                Try Again
                            </button>
                        </div>
                    ) : !details || details.status === 'none' ? (
                        <div className="text-center py-6">
                            <p className="text-slate-400">No active subscription found.</p>
                        </div>
                    ) : (
                        <>
                            {/* Plan Card */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">Current Plan</p>
                                        <h3 className="text-lg font-bold text-white">{details.planName}</h3>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${details.cancelAtPeriodEnd
                                        ? 'bg-yellow-500/10 text-yellow-500'
                                        : 'bg-green-500/10 text-green-500'
                                        }`}>
                                        {details.cancelAtPeriodEnd ? 'CANCELED' : 'ACTIVE'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <CreditCard className="w-4 h-4 text-slate-500" />
                                    <span className="capitalize">{details.brand} •••• {details.last4}</span>
                                </div>
                            </div>

                            {/* Renewal Info */}
                            <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-xl">
                                <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-white mb-1">
                                        {details.cancelAtPeriodEnd ? 'Access Expires On' : 'Next Renewal'}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {formatDate(details.currentPeriodEnd)}
                                    </p>
                                    {!details.cancelAtPeriodEnd && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            You will be charged ${details.amount} {details.interval === 'month' ? 'monthly' : 'yearly'}.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-2">
                                {/* Update Card (External) */}
                                <button
                                    onClick={onManageBillingFromStripe}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium border border-slate-700"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Update Payment Method
                                </button>

                                {/* Cancel Subscription */}
                                {!details.cancelAtPeriodEnd && (
                                    showCancelConfirm ? (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-500">Are you sure?</p>
                                                    <p className="text-xs text-red-400 mt-1">
                                                        You will lose access to Pro features on {formatDate(details.currentPeriodEnd)}.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowCancelConfirm(false)}
                                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Keep Plan
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                                                >
                                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                    Confirm Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="w-full text-sm text-red-400 hover:text-red-300 transition-colors py-2"
                                        >
                                            Cancel Subscription
                                        </button>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
