import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, getDocs, Timestamp, updateDoc } from 'firebase/firestore';
import { getUserEntitlement, type UserEntitlement } from '../utils/entitlement';
import { getAnsweredCount } from '../utils/questionMetrics';

interface SubscriptionContextType {
    isPro: boolean;
    entitlement: UserEntitlement;
    loading: boolean;
    questionsAnsweredToday: number;
    dailyLimit: number;
    canTakeQuiz: boolean; // Computed: (isPro || questionsAnsweredToday < dailyLimit)
    incrementDailyCount: (count: number) => void; // Optimistic update
    checkPermission: (feature: 'analytics' | 'simulator' | 'visual_mnemonics') => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Default safe state
    const [entitlement, setEntitlement] = useState<UserEntitlement>(getUserEntitlement(undefined, user));
    const [loading, setLoading] = useState(true);
    const [questionsAnsweredToday, setQuestionsAnsweredToday] = useState(0);

    const DAILY_LIMIT = 5;

    // 1. Listen for User Profile & Entitlement
    useEffect(() => {
        if (!user) {
            setEntitlement(getUserEntitlement(undefined, null));
            setLoading(false);
            return;
        }

        // OPTIMISTIC UPDATE: Check for new user immediately (before Firestore loads)
        const optimisticState = getUserEntitlement(undefined, user);
        if (optimisticState.isTrialActive) {
            setEntitlement(optimisticState);
            // If we have an optimistic trial, we are technically "loaded" enough to show the banner.
            // However, keeping loading=true prevents flashing if layout depends on it.
            // But requirement is "Trial banner visible IMMEDIATELY".
            // If the banner uses `entitlement.daysRemaining`, we have it.
            // We can set loading false to unblock UI.
            setLoading(false);
        }

        const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const newEntitlement = getUserEntitlement(data, user);

                // Check for EXPIRATION enforcement (Write operation)
                // If the local helper says it's expired (based on time) but the DB still says 'trial'
                // We must downgrade them in the DB to 'free'.
                if (newEntitlement.isTrialExpired && data.trial === true) {
                    console.log("SubscriptionProvider: Trial expired, downgrading user...");
                    try {
                        await updateDoc(doc(db, 'users', user.uid), {
                            plan: 'starter',
                            trial: false,
                            accessLevel: 'free',
                            trialConsumed: true // Ensure this stays true
                        });
                        // The write will trigger a new snapshot, updating state naturally.
                    } catch (err) {
                        console.error("Failed to downgrade expired user:", err);
                    }
                }

                setEntitlement(newEntitlement);
            } else {
                setEntitlement(getUserEntitlement(undefined));
            }
            setLoading(false);
        }, (error) => {
            console.warn("SubscriptionProvider: Failed to subscribe to user profile (likely permission error or missing doc). Defaulting to free/stateless.", error);
            setEntitlement(getUserEntitlement(undefined));
            setLoading(false);
        });

        return () => unsubscribeProfile();
    }, [user]);

    // 2. Calculate Daily Usage
    useEffect(() => {
        const fetchDailyUsage = async () => {
            if (!user) {
                setQuestionsAnsweredToday(0);
                return;
            }

            // Calculate start of today (Local Time)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            try {
                // Query completed runs from today (quizRuns subcollection)
                const q = query(
                    collection(db, 'quizRuns', user.uid, 'runs'),
                    where('completedAt', '>=', todayTimestamp)
                );

                const snapshot = await getDocs(q);
                let total = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    total += getAnsweredCount(data);
                });

                setQuestionsAnsweredToday(total);
            } catch (error) {
                console.error("Error fetching daily usage:", error);
            }
        };

        if (user) {
            fetchDailyUsage();
        }
    }, [user]);

    const incrementDailyCount = (count: number) => {
        setQuestionsAnsweredToday(prev => prev + count);
    };

    const checkPermission = (_feature: 'analytics' | 'simulator' | 'visual_mnemonics') => {
        if (entitlement.isPro) return true;
        return false;
    };

    // Derived Access State
    const isPro = entitlement.isPro;
    const canTakeQuiz = isPro || (questionsAnsweredToday < DAILY_LIMIT);

    return (
        <SubscriptionContext.Provider value={{
            isPro,
            entitlement,
            loading,
            questionsAnsweredToday,
            dailyLimit: DAILY_LIMIT,
            canTakeQuiz,
            incrementDailyCount,
            checkPermission
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
