/**
 * Bloom's Taxonomy cognitive levels — CIPHER's core differentiator.
 *
 * Every question in the bank is tagged with the level of thinking it requires,
 * so learners can see *where* their gap is (e.g., solid on Remember, weak on
 * Apply) instead of only *what* they got wrong.
 *
 * Levels are ordered from lowest to highest cognitive demand.
 */
export type BloomLevel =
    | 'Remember'    // recall facts, terms, definitions
    | 'Understand'  // explain concepts, interpret meaning
    | 'Apply'       // use knowledge in a new situation
    | 'Analyze'     // break info into parts, identify relationships
    | 'Evaluate'    // judge, critique, justify a decision
    | 'Create';     // produce new work, synthesize, design

export const BLOOM_LEVELS: readonly BloomLevel[] = [
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create',
] as const;

/** Short human-friendly descriptions for UI tooltips. */
export const BLOOM_DESCRIPTIONS: Record<BloomLevel, string> = {
    Remember: 'Recall facts, terms, or definitions',
    Understand: 'Explain ideas or interpret meaning',
    Apply: 'Use knowledge in a new situation',
    Analyze: 'Break information into parts and see how they relate',
    Evaluate: 'Judge, critique, or justify a decision',
    Create: 'Produce new work by combining ideas',
};
