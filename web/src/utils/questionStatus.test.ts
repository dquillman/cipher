import { describe, it, expect } from 'vitest';
import { isServable, excludeQuarantined } from './questionStatus';

describe('question quarantine', () => {
    // The whole point: ~1,500 existing documents have no status field, and they
    // must all keep flowing. This is the case a Firestore where-clause would
    // have silently broken.
    it('treats a missing status as active', () => {
        expect(isServable({ id: 'a' })).toBe(true);
        expect(isServable({ id: 'a', status: undefined })).toBe(true);
    });

    it('serves an explicitly active question', () => {
        expect(isServable({ id: 'a', status: 'active' })).toBe(true);
    });

    it('withholds a quarantined question', () => {
        expect(isServable({ id: 'a', status: 'quarantined' })).toBe(false);
    });

    it('does not withhold on some other status value', () => {
        expect(isServable({ id: 'a', status: 'draft' })).toBe(true);
    });

    it('filters a mixed bank and preserves order', () => {
        const bank = [
            { id: '1' },
            { id: '2', status: 'quarantined' },
            { id: '3', status: 'active' },
            { id: '4', status: 'quarantined' },
            { id: '5' },
        ];
        expect(excludeQuarantined(bank).map(q => q.id)).toEqual(['1', '3', '5']);
    });

    it('returns an empty array when every question is quarantined', () => {
        const bank = [{ id: '1', status: 'quarantined' }, { id: '2', status: 'quarantined' }];
        expect(excludeQuarantined(bank)).toEqual([]);
    });

    it('handles an empty bank', () => {
        expect(excludeQuarantined([])).toEqual([]);
    });
});
