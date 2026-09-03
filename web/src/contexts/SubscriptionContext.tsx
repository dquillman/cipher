import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { getUserEntitlement, type UserEntitlement } from '../utils/entitlement';
import { parsePassEntitlement, isPassActiveFor, type PassEntitlement } from '../utils/passEntitlement';
import { getFreeTierDailyLimit } from '../utils/freeTier';

interface SubscriptionContextType {
    isPro: boolean;
    entitlement: UserEntitlement;
    /** 90-day Exam Pass entitlement (users/{uid}.entitlement), live from the user doc. Null if none. */
    passEntitlement: PassEntitlement | null;
    /** True if an active (unexpired) exam pass covers this examId. Access rule: isPro || hasPassFor(examId). */
    hasPassFor: (examId: string) => boolean;
    loading: boolean;
    /** False until users/{uid} actually exists. See the note in the snapshot handler. */
    profileReady: boolean;
    questionsAnsweredToday: number;
    dailyLimit: number;
    canTakeQuiz: boolean; // Computed: (isPro || questionsAnsweredToday < dailyLimit)
    incrementDailyCount: (count: number) => void; // Optimistic update
    checkPermission: (feature: 'analytics' | 'simulator' | 'visual_mnemonics', examId?: string) => boolean;
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
    const [passEntitlement, setPassEntitlement] = useState<PassEntitlement | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileReady, setProfileReady] = useState(false);
    const [questionsAnsweredToday, setQuestionsAnsweredToday] = useState(0);

    // Free-tier daily cap — 20/day during the 7-day taste window
    // (post-signup or post-trial-end, whichever is later), then 5/day.
    // See utils/freeTier.ts for policy. Pro/trial/tester users bypass.
    const accountCreatedAt = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime)
        : null;
    const DAILY_LIMIT = getFreeTierDailyLimit({
        accountCreatedAt,
        trialEndsAt: entitlement.trialEndsAt,
    });

    // 1. Listen for User Profile & Entitlement
    useEffect(() => {
        if (!user) {
            setEntitlement(getUserEntitlement(undefined, null));
            setPassEntitlement(null);
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

        const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const newEntitlement = getUserEntitlement(data, user);

                setEntitlement(newEntitlement);
                setPassEntitlement(parsePassEntitlement(data.entitlement));
                setProfileReady(true);
            } else {
                // users/{uid} is written by the createUserProfile auth trigger,
                // which is async -- and Login.tsx navigates the instant the
                // account is created. So for the first seconds of every signup
                // this branch runs, and it looks identical to a long-standing
                // free user who has never taken a trial. That is what put a
                // "Free plan: 0 / 20 questions used today. Upgrade for
                // unlimited practice" banner and a "Start your 14-day Pro
                // trial" modal on the first screen after signup -- offering a
                // trial the account had just been auto-granted, whose button
                // could only ever return 'User profile is not ready' or
                // 'Trial already used'.
                //
                // profileReady stays false so those surfaces can wait. loading
                // still flips, because the rest of the app must render.
                setEntitlement(getUserEntitlement(undefined));
                setPassEntitlement(null);
                setProfileReady(false);
            }
            setLoading(false);
        }, (error) => {
            console.warn("SubscriptionProvider: Failed to subscribe to user profile (likely permission error or missing doc). Defaulting to free/stateless.", error);
            setEntitlement(getUserEntitlement(undefined));
            setPassEntitlement(null);
            setProfileReady(false);
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

            // Read the same server-written ledger the cap is now enforced from
            // (usageCounters/{uid}_{yyyy-mm-dd}), so the "x / N used today" banner
            // matches what validateQuizStart will actually count. It used to scan
            // completed quizRuns — the gameable query that let "Quit & Save" and
            // run-deletion show 0 used. The doc id uses the UTC date to match the
            // trackAnswerUsage trigger.
            const day = new Date().toISOString().slice(0, 10);
            try {
                const snap = await getDoc(doc(db, 'usageCounters', `${user.uid}_${day}`));
                setQuestionsAnsweredToday(snap.exists() ? Number(snap.data()?.answeredCount || 0) : 0);
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

    // Exam Pass: content for exam X is unlocked if isPro OR hasPassFor(X).
    const hasPassFor = (examId: string) => isPassActiveFor(passEntitlement, examId);

    const checkPermission = (_feature: 'analytics' | 'simulator' | 'visual_mnemonics', examId?: string) => {
        if (entitlement.isPro) return true;
        if (examId && isPassActiveFor(passEntitlement, examId)) return true;
        return false;
    };

    // Derived Access State
    const isPro = entitlement.isPro;
    const canTakeQuiz = isPro || (questionsAnsweredToday < DAILY_LIMIT);

    return (
        <SubscriptionContext.Provider value={{
            isPro,
            entitlement,
            passEntitlement,
            hasPassFor,
            loading,
            profileReady,
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
