/**
 * Readiness Confidence Modifier (RCM)
 *
 * XP reflects study consistency and engagement — behaviors that correlate
 * with exam readiness but aren't captured by accuracy alone. A student who
 * has answered 500+ questions with consistent daily practice has more
 * reliable performance data than one with the same accuracy over 50 questions.
 *
 * The RCM adjusts the *displayed* readiness score to reflect this signal.
 * It does NOT modify stored metrics, domain analytics, or question scoring.
 *
 * Tier logic:
 *   XP < 100   → 0.90  (limited evidence, accuracy may be unreliable)
 *   XP 100–499 → 0.95  (building confidence in the data)
 *   XP 500–999 → 1.00  (baseline reliability reached, no adjustment)
 *   XP 1000+   → 1.03  (sustained practice increases prediction confidence)
 *
 * Why capped at +3%: XP is a confidence signal, not a performance replacement.
 * A 3% ceiling prevents XP grinding from inflating readiness beyond what
 * accuracy data actually supports.
 */

const RCM_TIERS = [
    { minXp: 1000, multiplier: 1.03 },
    { minXp: 500,  multiplier: 1.00 },
    { minXp: 100,  multiplier: 0.95 },
    { minXp: 0,    multiplier: 0.90 },
] as const;

/**
 * Returns the confidence multiplier for a given XP value.
 */
export function calculateReadinessConfidence(xp: number): number {
    for (const tier of RCM_TIERS) {
        if (xp >= tier.minXp) return tier.multiplier;
    }
    return RCM_TIERS[RCM_TIERS.length - 1].multiplier;
}

/**
 * Applies the RCM to a base readiness score.
 * Returns null when the base score is null (preliminary state).
 * Result is clamped to [0, 100].
 */
export function applyReadinessConfidence(
    baseReadiness: number | null,
    xp: number,
): number | null {
    if (baseReadiness === null) return null;
    const modifier = calculateReadinessConfidence(xp);
    return Math.round(Math.min(100, Math.max(0, baseReadiness * modifier)));
}
