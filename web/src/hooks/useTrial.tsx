import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { useSubscription } from '../contexts/SubscriptionContext';

export interface TrialUIState {
    status: 'active' | 'expired' | 'none' | 'pro';
    daysRemaining: number;
    hoursRemaining: number;
}

export function useTrial() {
    const { entitlement } = useSubscription();
    const [actionLoading, setActionLoading] = useState(false);

    // Derive UI state from centralized entitlement
    const getTrialState = (): TrialUIState => {
        if (entitlement.plan === 'pro') return { status: 'pro', daysRemaining: 0, hoursRemaining: 0 };

        if (entitlement.isTrialActive) {
            return {
                status: 'active',
                daysRemaining: entitlement.daysRemaining,
                hoursRemaining: entitlement.hoursRemaining
            };
        }

        if (entitlement.isTrialExpired) {
            return { status: 'expired', daysRemaining: 0, hoursRemaining: 0 };
        }

        return { status: 'none', daysRemaining: 0, hoursRemaining: 0 };
    };

    const trial = getTrialState();

    const startTrial = async () => {
        if (!auth.currentUser) return false;

        try {
            setActionLoading(true);
            const startTrialFn = httpsCallable(functions, 'startTrial');
            const result = await startTrialFn({});
            const data = result.data as { success: boolean; trialEndsAt: string };
            return data.success === true;
        } catch (err) {
            console.error("Failed to start trial:", err);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        trial,
        loading: actionLoading,
        startTrial
    };
}
