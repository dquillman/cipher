import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface MarketingCopy {
    pro_value_primary: string;
    pro_value_secondary: string;
}

// DEFAULT COPY (Local Fallback)
// Matches the current hardcoded values in Pricing.tsx to ensure no UI regression if fetch fails.
const DEFAULT_COPY: MarketingCopy = {
    pro_value_primary: "Unlock Your Full Potential",
    pro_value_secondary: "Get unlimited access to AI-generated questions, advanced analytics, and domain mastery tracking."
};

/**
 * Hook to safely fetch marketing copy from Firestore with local fallback.
 * FAIL-SAFE: If Firestore is unreachable, offline, or empty, this silently returns the defaults.
 * READ-ONLY: Configuration only.
 */
export const useMarketingCopy = () => {
    // Initialize with defaults immediately (FAIL-SAFE)
    const [copy, setCopy] = useState<MarketingCopy>(DEFAULT_COPY);

    useEffect(() => {
        const fetchCopy = async () => {
            try {
                // Non-blocking, single read
                const ref = doc(db, 'marketing_assets', 'examcoach_pro');
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const data = snap.data();
                    // Only override if fields are present and non-empty strings
                    setCopy(prev => ({
                        pro_value_primary: data.pro_value_primary || prev.pro_value_primary,
                        pro_value_secondary: data.pro_value_secondary || prev.pro_value_secondary
                    }));
                }
            } catch (error) {
                // Silent fallback - do not surface error to user
                // Using console.debug to avoid cluttering production logs, or warn for dev visibility
                console.debug("Using default marketing copy (remote fetch skipped or failed)");
            }
        };

        fetchCopy();
    }, []);

    return copy;
};
