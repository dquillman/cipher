import { Timestamp, type DocumentData } from 'firebase/firestore';
import { type User } from 'firebase/auth';

export type UserPlan = 'free' | 'trial' | 'pro' | 'starter';
export type AccessLevel = 'free' | 'pro';

export interface UserEntitlement {
    isFree: boolean;
    isTrialActive: boolean;
    isTrialExpired: boolean;
    isPro: boolean;
    daysRemaining: number;
    hoursRemaining: number;

    // Internal data for context consistency/updates
    plan: UserPlan;
    accessLevel: AccessLevel;
    trialConsumed: boolean;
    trialEndsAt: Date | null;
}

/**
 * Calculates the user's current entitlement state based on their Firestore document.
 * This is the SINGLE SOURCE OF TRUTH for access control.
 */


/**
 * Calculates the user's current entitlement state based on their Firestore document.
 * This is the SINGLE SOURCE OF TRUTH for access control.
 *
 * @param userData - The raw Firestore document data
 * @param authUser - Optional Firebase Auth user for optimistic "New User" detection
 */
export function getUserEntitlement(userData: DocumentData | undefined, authUser?: User | null): UserEntitlement {
    // Default safe state (Free)
    const defaultState: UserEntitlement = {
        isFree: true,
        isTrialActive: false,
        isTrialExpired: false,
        isPro: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        plan: 'free',
        accessLevel: 'free',
        trialConsumed: false,
        trialEndsAt: null
    };

    const now = new Date();

    // 0. DETECT BRAND NEW USER
    const isBrandNewUser = authUser && authUser.metadata.creationTime === authUser.metadata.lastSignInTime;

    // 1. ANALYZE FIRESTORE DATA (If present)
    let firestoreEntitlement: UserEntitlement | null = null;

    if (userData) {
        const plan = (userData.plan as UserPlan) || 'free';

        // Handle COMPED / TESTER access (non-billing Pro access)
        const isComped = userData.billingStatus === 'comped';
        const isTester = userData.role === 'tester' || userData.testerOverride === true;
        if (isComped || isTester) {
            // Check if tester access has an expiration
            const testerExpiresAt = userData.testerExpiresAt instanceof Timestamp
                ? userData.testerExpiresAt.toDate()
                : null;

            // If no expiration set, or expiration is in the future, grant Pro access
            if (!testerExpiresAt || testerExpiresAt > now) {
                return {
                    ...defaultState,
                    isFree: false,
                    isPro: true,
                    plan: 'pro',
                    accessLevel: 'pro',
                    trialConsumed: true
                };
            }
            // If tester access has expired, fall through to normal logic
        }

        // Handle explicit legacy "isPro" override
        if (userData.isPro === true) {
            return {
                ...defaultState,
                isFree: false,
                isPro: true,
                plan: 'pro',
                accessLevel: 'pro',
                trialConsumed: true
            };
        }

        // Pro Plan (Paid or Persistent Trial)
        if (plan === 'pro') {
            if (userData.trial === true) {
                const trialEndsAt = userData.trialEndsAt instanceof Timestamp
                    ? userData.trialEndsAt.toDate()
                    : null;

                if (trialEndsAt) {
                    const diffMs = trialEndsAt.getTime() - now.getTime();
                    const isExpired = diffMs <= 0;

                    if (!isExpired) {
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        return {
                            isFree: false,
                            isTrialActive: true,
                            isTrialExpired: false,
                            isPro: true,
                            daysRemaining: days,
                            hoursRemaining: hours,
                            plan: 'trial',
                            accessLevel: 'pro',
                            trialConsumed: true,
                            trialEndsAt
                        };
                    } else {
                        // EXPLICITLY EXPIRED
                        firestoreEntitlement = {
                            ...defaultState,
                            isFree: true,
                            isTrialActive: false,
                            isTrialExpired: true,
                            isPro: false,
                            plan: 'free',
                            accessLevel: 'free',
                            trialConsumed: true,
                            trialEndsAt
                        };
                    }
                }
            } else {
                return {
                    ...defaultState,
                    isFree: false,
                    isPro: true,
                    plan: 'pro',
                    accessLevel: 'pro',
                    trialConsumed: true
                };
            }
        }

        // Handle explicit "Trial" plan 
        else if (plan === 'trial') {
            const trialEndsAt = userData.trialEndsAt instanceof Timestamp
                ? userData.trialEndsAt.toDate()
                : null;
            if (trialEndsAt && trialEndsAt <= now) {
                // EXPLICITLY EXPIRED
                firestoreEntitlement = {
                    ...defaultState,
                    isFree: true,
                    isTrialActive: false,
                    isTrialExpired: true,
                    isPro: false,
                    plan: 'trial',
                    accessLevel: 'free',
                    trialConsumed: true,
                    trialEndsAt
                };
            } else if (trialEndsAt) {
                const diffMs = trialEndsAt.getTime() - now.getTime();
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                return {
                    isFree: false,
                    isTrialActive: true,
                    isTrialExpired: false,
                    isPro: true,
                    daysRemaining: days,
                    hoursRemaining: hours,
                    plan: 'trial',
                    accessLevel: 'pro',
                    trialConsumed: true,
                    trialEndsAt
                };
            }
        }
    }

    // 2. PRECEDENCE RULE: 
    // If Firestore explicitly says "Expired" -> Respect it (User is not brand new in this case anyway, or logic overrides).
    if (firestoreEntitlement?.isTrialExpired) {
        return firestoreEntitlement;
    }

    // 3. OPTIMISTIC TRIAL OVERRIDE
    // If we are here, Firestore didn't return a valid active trial OR an explicitly expired trial.
    // It is either "Free", "Missing", or "Undefined".
    // If the user is BRAND NEW, we FORCE the trial state.
    if (isBrandNewUser) {
        const trialDays = 14;
        const trialEndsAt = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
        return {
            isFree: false,
            isTrialActive: true,
            isTrialExpired: false,
            isPro: true,
            daysRemaining: 14,
            hoursRemaining: 0,
            plan: 'trial', // Force trial
            accessLevel: 'pro',
            trialConsumed: true,
            trialEndsAt
        };
    }

    // 4. Default Fallback
    // If Firestore returned something (e.g. valid free plan), return it.
    // Otherwise default state.
    if (userData) {
        const plan = (userData.plan as UserPlan) || 'free';
        const trialConsumed = userData.trialConsumed || false;
        return {
            ...defaultState,
            plan,
            trialConsumed,
            isTrialExpired: trialConsumed
        };
    }

    return defaultState;
}
