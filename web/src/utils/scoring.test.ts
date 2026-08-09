import { describe, it, expect } from 'vitest';
import { isMultiResponseCorrect, canSubmitMultiResponse, toggleSelection } from './scoring';

describe('isMultiResponseCorrect', () => {
    it('accepts an exact match', () => {
        expect(isMultiResponseCorrect([0, 2], [0, 2])).toBe(true);
    });

    it('ignores selection order', () => {
        expect(isMultiResponseCorrect([0, 2], [2, 0])).toBe(true);
        expect(isMultiResponseCorrect([1, 3, 0], [0, 1, 3])).toBe(true);
    });

    it('ignores duplicate selections', () => {
        expect(isMultiResponseCorrect([0, 2], [0, 2, 2, 0])).toBe(true);
    });

    it('rejects a partial answer — PMI gives no partial credit', () => {
        expect(isMultiResponseCorrect([0, 2], [0])).toBe(false);
        expect(isMultiResponseCorrect([0, 1, 2], [0, 1])).toBe(false);
    });

    it('rejects an over-selection that contains every correct answer', () => {
        // Selecting everything must never score — otherwise the optimal exam
        // strategy is to tick all four boxes on every multiple-response item.
        expect(isMultiResponseCorrect([0, 2], [0, 1, 2])).toBe(false);
        expect(isMultiResponseCorrect([0, 2], [0, 1, 2, 3])).toBe(false);
    });

    it('rejects a same-length answer with the wrong members', () => {
        expect(isMultiResponseCorrect([0, 2], [1, 3])).toBe(false);
        expect(isMultiResponseCorrect([0, 2], [0, 3])).toBe(false);
    });

    it('scores a malformed question wrong rather than free', () => {
        expect(isMultiResponseCorrect(undefined, [0])).toBe(false);
        expect(isMultiResponseCorrect([], [0])).toBe(false);
        expect(isMultiResponseCorrect([], [])).toBe(false);
    });

    it('rejects an empty selection', () => {
        expect(isMultiResponseCorrect([0, 2], [])).toBe(false);
        expect(isMultiResponseCorrect([0, 2], undefined)).toBe(false);
    });

    it('handles a single-answer key without collapsing into MCQ behaviour', () => {
        expect(isMultiResponseCorrect([1], [1])).toBe(true);
        expect(isMultiResponseCorrect([1], [1, 2])).toBe(false);
    });
});

describe('canSubmitMultiResponse', () => {
    it('requires at least one selection', () => {
        expect(canSubmitMultiResponse([])).toBe(false);
        expect(canSubmitMultiResponse(undefined)).toBe(false);
        expect(canSubmitMultiResponse([0])).toBe(true);
    });

    it('does not require matching the key length, which would leak the answer count', () => {
        // One tick is enough to submit even when two are correct.
        expect(canSubmitMultiResponse([0])).toBe(true);
    });
});

describe('toggleSelection', () => {
    it('adds an unselected index', () => {
        expect(toggleSelection([], 2)).toEqual([2]);
        expect(toggleSelection([0], 2)).toEqual([0, 2]);
    });

    it('removes a selected index', () => {
        expect(toggleSelection([0, 2], 0)).toEqual([2]);
        expect(toggleSelection([2], 2)).toEqual([]);
    });

    it('keeps the result sorted regardless of click order', () => {
        expect(toggleSelection([3], 1)).toEqual([1, 3]);
        expect(toggleSelection([1, 3], 0)).toEqual([0, 1, 3]);
    });

    it('does not mutate its input', () => {
        const before = [0, 2];
        toggleSelection(before, 1);
        expect(before).toEqual([0, 2]);
    });
});
