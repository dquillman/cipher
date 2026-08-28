/**
 * Quarantine: take a question out of circulation without deleting it.
 *
 * Written for the AI-AutoLeveler problem — 46% of the questions that source
 * generated for the Security+ bank test no security content at all (see
 * docs/question-bank-generator-audit-2026-08-28.md). Rewriting them is weeks of
 * authoring; stopping them being served is one field.
 *
 * WHY THIS IS A CLIENT-SIDE FILTER AND NOT A FIRESTORE `where`:
 *
 * Every existing question document has no `status` field at all. A Firestore
 * inequality — `where('status', '!=', 'quarantined')` — matches only documents
 * where the field EXISTS and differs. Documents missing the field are excluded
 * from the result set entirely, so that clause would return zero questions for
 * every bank until each of the ~1,500 documents had been backfilled. Same trap
 * with `not-in`. A positive `where('status','==','active')` has the identical
 * problem.
 *
 * The quiz already pulls the whole bank for the active exam to run its SRS
 * selection client-side, so filtering here costs nothing and is correct on day
 * one, with no backfill and no composite index.
 */

export type QuestionStatus = 'active' | 'quarantined';

/** A question is servable unless it has been explicitly quarantined. */
export function isServable<T extends { status?: string }>(q: T): boolean {
    return q?.status !== 'quarantined';
}

/**
 * Drop quarantined questions from a fetched bank. Absent `status` means active,
 * so untouched documents keep flowing.
 */
export function excludeQuarantined<T extends { status?: string }>(questions: T[]): T[] {
    return questions.filter(isServable);
}
