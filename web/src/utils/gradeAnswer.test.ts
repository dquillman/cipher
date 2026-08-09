import { describe, it, expect } from 'vitest';
import { gradeAnswer, gradesBySingleIndex, filterToSingleIndexGraded } from './scoring';

/**
 * gradeAnswer is the branch Quiz.tsx uses at all three of its grading sites
 * (submit, next, quit-and-save). These cases are written as the exact shapes
 * Quiz.tsx passes, so a regression in the branch is caught here rather than in
 * a stored quiz record nobody looks at.
 */
describe('gradeAnswer — single-select MCQ (100% of shipped content)', () => {
    it('scores the matching index correct', () => {
        expect(gradeAnswer({ type: 'mcq', selectedOption: 2, correctAnswer: 2 })).toBe(true);
    });

    it('scores a different index wrong', () => {
        expect(gradeAnswer({ type: 'mcq', selectedOption: 1, correctAnswer: 2 })).toBe(false);
    });

    it('treats index 0 as a real answer, not as falsy', () => {
        expect(gradeAnswer({ type: 'mcq', selectedOption: 0, correctAnswer: 0 })).toBe(true);
        expect(gradeAnswer({ type: 'mcq', selectedOption: 0, correctAnswer: 3 })).toBe(false);
    });

    it('scores an untyped (legacy) question exactly like an mcq', () => {
        // Production docs predate the `type` field. They must keep grading.
        expect(gradeAnswer({ selectedOption: 3, correctAnswer: 3 })).toBe(true);
        expect(gradeAnswer({ selectedOption: 3, correctAnswer: 1 })).toBe(false);
    });

    it("scores an 'emv' question by single index", () => {
        expect(gradeAnswer({ type: 'emv', selectedOption: 1, correctAnswer: 1 })).toBe(true);
    });

    it('scores no selection wrong', () => {
        expect(gradeAnswer({ type: 'mcq', selectedOption: null, correctAnswer: 2 })).toBe(false);
    });

    it('scores a question with no answer key wrong, not free', () => {
        // `null === undefined` was already false in the original inline
        // comparison. Locking it in: a key-less doc must never award a point.
        expect(gradeAnswer({ type: 'mcq', selectedOption: null, correctAnswer: undefined })).toBe(false);
        expect(gradeAnswer({ type: 'mcq', selectedOption: 1, correctAnswer: undefined })).toBe(false);
    });
});

describe('gradeAnswer — multi-response', () => {
    it('scores an exact match correct regardless of tick order', () => {
        expect(gradeAnswer({ type: 'multi-response', correctAnswers: [0, 2], multiSelected: [2, 0] })).toBe(true);
    });

    it('gives no partial credit', () => {
        expect(gradeAnswer({ type: 'multi-response', correctAnswers: [0, 2], multiSelected: [0] })).toBe(false);
    });

    it('rejects ticking everything', () => {
        expect(gradeAnswer({ type: 'multi-response', correctAnswers: [0, 2], multiSelected: [0, 1, 2, 3] })).toBe(false);
    });

    it('scores an empty selection wrong', () => {
        expect(gradeAnswer({ type: 'multi-response', correctAnswers: [0, 2], multiSelected: [] })).toBe(false);
    });

    it('NEVER falls through to the single-index comparison', () => {
        // The bug this guards: a multi-response doc that also carries a stray
        // `correctAnswer` must not be gradeable by picking one option. If the
        // branch order ever inverts, this goes true.
        expect(gradeAnswer({
            type: 'multi-response',
            correctAnswer: 1,
            selectedOption: 1,
            correctAnswers: [0, 2],
            multiSelected: [1],
        })).toBe(false);
    });

    it('scores a multi-response doc with no correctAnswers key wrong, not free', () => {
        expect(gradeAnswer({ type: 'multi-response', correctAnswers: undefined, multiSelected: [0, 1] })).toBe(false);
    });
});

describe('gradeAnswer — pbq and matching keep their existing behaviour', () => {
    it('uses the pbq thunk when the pbq state exists', () => {
        expect(gradeAnswer({ type: 'pbq', isPbqCorrect: () => true })).toBe(true);
        expect(gradeAnswer({ type: 'pbq', isPbqCorrect: () => false })).toBe(false);
    });

    it('uses the matching thunk when the matching state exists', () => {
        expect(gradeAnswer({ type: 'matching', isMatchingCorrect: () => true })).toBe(true);
        expect(gradeAnswer({ type: 'matching', isMatchingCorrect: () => false })).toBe(false);
    });

    it('falls through to single-index when the interaction state is absent', () => {
        // Mirrors the original `type === 'pbq' && pbqState && pbqConfig` guard:
        // no state means the ternary chain fell through. Preserved exactly.
        expect(gradeAnswer({ type: 'pbq', selectedOption: 2, correctAnswer: 2 })).toBe(true);
        expect(gradeAnswer({ type: 'matching', selectedOption: 2, correctAnswer: 3 })).toBe(false);
    });

    it('does not call the pbq thunk for a non-pbq question', () => {
        let called = false;
        gradeAnswer({
            type: 'mcq',
            isPbqCorrect: () => { called = true; return true; },
            selectedOption: 1,
            correctAnswer: 1,
        });
        expect(called).toBe(false);
    });
});

describe('gradesBySingleIndex', () => {
    it('is true for the formats that carry one selected index and one key index', () => {
        expect(gradesBySingleIndex(undefined)).toBe(true);
        expect(gradesBySingleIndex('mcq')).toBe(true);
        expect(gradesBySingleIndex('emv')).toBe(true);
    });

    it('is false for every format that does not', () => {
        expect(gradesBySingleIndex('matching')).toBe(false);
        expect(gradesBySingleIndex('pbq')).toBe(false);
        expect(gradesBySingleIndex('multi-response')).toBe(false);
    });

    it('is false for an unknown future format — allow-list, fails safe', () => {
        // This is the whole point of the allow-list. When someone widens
        // QuestionType next, the new format is excluded from the simulator and
        // from the coach until they opt it in, instead of being silently graded
        // against a `correctAnswer` it does not have.
        expect(gradesBySingleIndex('hotspot')).toBe(false);
        expect(gradesBySingleIndex('case-study')).toBe(false);
        expect(gradesBySingleIndex('drag-and-drop')).toBe(false);
    });
});

describe('filterToSingleIndexGraded', () => {
    it('keeps mcq/emv/untyped and drops the rest', () => {
        const bank = [
            { id: 'a' },
            { id: 'b', type: 'mcq' },
            { id: 'c', type: 'emv' },
            { id: 'd', type: 'multi-response' },
            { id: 'e', type: 'matching' },
            { id: 'f', type: 'pbq' },
        ];
        expect(filterToSingleIndexGraded(bank).map((q) => q.id)).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty list rather than admitting an ungradeable question', () => {
        expect(filterToSingleIndexGraded([{ type: 'multi-response' }])).toEqual([]);
    });
});
