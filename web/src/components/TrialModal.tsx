import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTrial } from '../hooks/useTrial';
import { trackTrialStart } from '../lib/ga4';
import { Rocket } from 'lucide-react';

export default function TrialModal() {
    const { user } = useAuth();
    const { entitlement } = useSubscription();
    const { startTrial, loading } = useTrial();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Strict visibility rules:
        // 1. Must be on 'free' plan
        // 2. Must NEVER have consumed a trial
        // 3. Not hidden by local session "Not Now" (optional UX polish, keeping for session niceness)

        const shouldShow =
            entitlement.plan === 'free' &&
            !entitlement.trialConsumed &&
            !entitlement.isPro;

        if (shouldShow) {
            // Check session storage for "Not now" to avoid annoying on every page load in same session
            const snoozed = sessionStorage.getItem(`trial_snooze_${user.uid}`);
            if (!snoozed) {
                // Small delay to ensure not flashing on load
                const timer = setTimeout(() => setIsOpen(true), 1500);
                return () => clearTimeout(timer);
            }
        } else {
            setIsOpen(false);
        }
    }, [user, entitlement]);

    const handleStartTrial = async () => {
        const success = await startTrial();
        if (success) {
            trackTrialStart();
            setIsOpen(false);
        }
    };

    const handleNotNow = () => {
        setIsOpen(false);
        if (user) {
            sessionStorage.setItem(`trial_snooze_${user.uid}`, 'true');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-brand-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

                <div className="text-center">
                    <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20 shadow-lg shadow-brand-500/10">
                        <Rocket className="h-8 w-8 text-brand-400" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 font-display">Start your 14-day Pro trial</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Unlock infinite practice questions, full explanations, AI tutoring, and all Pro features.
                        <br /><br />
                        <span className="text-brand-400 font-bold bg-brand-500/10 px-2 py-1 rounded">No payment required.</span>
                    </p>

                    <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 mb-4 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Activating...' : 'Start Free Trial'}
                    </button>

                    <button
                        onClick={handleNotNow}
                        className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
}
