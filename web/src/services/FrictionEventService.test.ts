import { describe, it, expect, vi, beforeEach } from 'vitest';

// Firestore is mocked wholesale — the point of these tests is the shape of the
// payload we hand to addDoc, not that Firestore accepts it over the wire.
const addDoc = vi.fn(() => Promise.resolve({ id: 'x' }));

vi.mock('firebase/firestore', () => ({
    addDoc: (...args: unknown[]) => addDoc(...args),
    collection: (_db: unknown, name: string) => ({ name }),
    serverTimestamp: () => 'TS',
}));
vi.mock('../firebase', () => ({ db: {} }));

const store = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
});
vi.stubGlobal('window', { location: { pathname: '/app/quiz/abc' } });

const { FrictionEventService } = await import('./FrictionEventService');

const lastPayload = () => addDoc.mock.calls.at(-1)?.[1] as Record<string, unknown>;

describe('FrictionEventService.emit', () => {
    beforeEach(() => {
        addDoc.mockClear();
        store.clear();
    });

    // EC: this is the regression. question.type is optional and absent on
    // ordinary multiple-choice items, and one undefined value made Firestore
    // reject the entire document — every coach_timing event was being dropped.
    it('drops undefined meta values instead of sending them', () => {
        FrictionEventService.emit('u1', 'coach_timing', {
            page: 'quiz',
            questionType: undefined,
            examId: undefined,
            coachMs: 812,
        });

        const meta = lastPayload().meta as Record<string, unknown>;
        expect(Object.keys(meta).sort()).toEqual(['coachMs', 'page']);
        expect('questionType' in meta).toBe(false);
        expect('examId' in meta).toBe(false);
    });

    it('keeps falsy values that are not undefined', () => {
        FrictionEventService.emit('u1', 'slow_load', {
            loadTimeMs: 0,
            page: '',
            errorMessage: null as unknown as string,
        });

        const meta = lastPayload().meta as Record<string, unknown>;
        expect(meta).toEqual({ loadTimeMs: 0, page: '', errorMessage: null });
    });

    it('sends an empty meta object when none is supplied', () => {
        FrictionEventService.emit('u1', 'empty_state');
        expect(lastPayload().meta).toEqual({});
    });

    it('never throws when Firestore rejects synchronously', () => {
        addDoc.mockImplementationOnce(() => {
            throw new Error('invalid data');
        });
        expect(() => FrictionEventService.emit('u1', 'network_error', { page: 'quiz' })).not.toThrow();
    });

    it('caps ordinary events at 5 per session', () => {
        for (let i = 0; i < 8; i++) FrictionEventService.emit('u1', 'paywall_hit', { page: 'quiz' });
        expect(addDoc).toHaveBeenCalledTimes(5);
    });

    it('allows 40 coach_timing events — one per answered question', () => {
        for (let i = 0; i < 45; i++) FrictionEventService.emit('u1', 'coach_timing', { coachMs: i });
        expect(addDoc).toHaveBeenCalledTimes(40);
    });
});
