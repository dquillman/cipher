/**
 * Pure answer-scoring primitives.
 *
 * These live outside the Quiz component on purpose. Scoring is the one place a
 * bug is invisible — a mis-rendered question is obvious, a mis-scored one just
 * quietly tells someone they're ready when they aren't. Keeping the logic pure
 * means it can be exhaustively tested without mounting anything.
 */

/**
 * Multiple-response scoring, per the PMI PMP Examination Content Outline
 * (July 2026): "Multiple answer choices with more than one correct answer."
 *
 * ALL-OR-NOTHING. PMI awards no partial credit on multiple-response items, so
 * neither do we — a practice tool that scores more generously than the real
 * exam produces false confidence, which is the specific failure this product
 * exists to prevent.
 *
 * Selection order is irrelevant; duplicates are ignored.
 */
export function isMultiResponseCorrect(
    correctAnswers: number[] | undefined,
    selected: number[] | undefined,
): boolean {
    // A multiple-response item with no answer key is a data defect. Score it
    // wrong rather than free — silently awarding a point would hide the defect.
    if (!correctAnswers || correctAnswers.length === 0) return false;
    if (!selected || selected.length === 0) return false;

    const want = new Set(correctAnswers);
    const got = new Set(selected);
    if (want.size !== got.size) return false;
    for (const v of want) if (!got.has(v)) return false;
    return true;
}

/**
 * True once the candidate has committed enough to submit.
 *
 * Deliberately only requires ONE selection rather than matching the key's
 * length: telling someone "pick 2" that they haven't picked enough would leak
 * the number of correct answers, which the real exam does not do.
 */
export function canSubmitMultiResponse(selected: number[] | undefined): boolean {
    return !!selected && selected.length > 0;
}

/** Adds or removes an index, returning a new sorted array. */
export function toggleSelection(selected: number[], index: number): number[] {
    return selected.includes(index)
        ? selected.filter((i) => i !== index)
        : [...selected, index].sort((a, b) => a - b);
}

/**
 * True when a question's answer is ONE index into `options` and its key is ONE
 * index in `correctAnswer` — i.e. `selected === q.correctAnswer` is a valid way
 * to grade it.
 *
 * ALLOW-LIST ON PURPOSE. Any type not named here is excluded, so a format added
 * to QuestionType later is treated as not-single-index until someone explicitly
 * says otherwise. The failure this prevents is silent: a `correctAnswer`-based
 * comparison against a question that has no `correctAnswer` does not throw, it
 * just returns false and marks the candidate wrong forever.
 *
 * Callers use it for three things:
 *   - grading (see gradeAnswer below),
 *   - excluding un-renderable items from surfaces that only speak single-index
 *     (exam Simulator, Verbal mode),
 *   - gating the AI coach breakdown, which is prompted with a single
 *     correctAnswerIndex / userSelectedOptionIndex pair.
 */
export function gradesBySingleIndex(type: string | undefined | null): boolean {
    return type === undefined || type === null || type === 'mcq' || type === 'emv';
}

/**
 * Drops questions that cannot be graded by a single selected index.
 *
 * For surfaces that render one radio group and store `Record<number, number>`.
 * Showing four options of a multiple-response item there and grading the pick
 * against a `correctAnswer` the doc does not have marks it wrong no matter what
 * the candidate does — a silent mis-grade. Excluding is the honest behaviour
 * until those surfaces grow a multi-select renderer.
 */
export function filterToSingleIndexGraded<T extends { type?: string }>(questions: T[]): T[] {
    return questions.filter((q) => gradesBySingleIndex(q.type));
}

/**
 * THE grading branch. Every place that decides "was this answer right?" must go
 * through here.
 *
 * It exists because that decision was previously copy-pasted at three call
 * sites in Quiz.tsx (submit, next, quit-and-save). Three copies of a ternary
 * chain is three chances to add a format to two of them, and a question graded
 * correctly on submit but incorrectly on save is invisible in the UI and wrong
 * in the stored record. One function, one behaviour, testable without mounting
 * a component.
 *
 * PBQ and matching correctness depend on interaction state that lives in the
 * component, so they come in as thunks. A thunk being absent means "that state
 * isn't ready" and matches the old `type === 'pbq' && pbqState && pbqConfig`
 * guards exactly: the chain falls through to the single-index comparison, which
 * is what the original code did.
 */
export interface GradeAnswerInput {
    type?: string;
    /** Provide ONLY when type is 'pbq' and the pbq interaction state exists. */
    isPbqCorrect?: () => boolean;
    /** Provide ONLY when type is 'matching' and the matching state exists. */
    isMatchingCorrect?: () => boolean;
    /** `multi-response` answer key. */
    correctAnswers?: number[];
    /** `multi-response` ticked indices. */
    multiSelected?: number[];
    /** Single-index key. */
    correctAnswer?: number;
    /** Single-index selection. */
    selectedOption?: number | null;
}

export function gradeAnswer(input: GradeAnswerInput): boolean {
    if (input.type === 'pbq' && input.isPbqCorrect) return input.isPbqCorrect();
    if (input.type === 'matching' && input.isMatchingCorrect) return input.isMatchingCorrect();
    if (input.type === 'multi-response') {
        return isMultiResponseCorrect(input.correctAnswers, input.multiSelected);
    }
    // Single-select MCQ — byte-equivalent to the original
    // `selectedOption === currentQuestion.correctAnswer`. The explicit
    // null/undefined rejection is not a behaviour change: `null === undefined`
    // was already false, it just makes the types line up.
    if (input.selectedOption === null || input.selectedOption === undefined) return false;
    return input.selectedOption === input.correctAnswer;
}
