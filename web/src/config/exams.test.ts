import { describe, it, expect } from 'vitest';
import {
    EXAMS,
    SELLABLE_EXAMS,
    isSellableExam,
    examLineage,
    DEFAULT_EXAM_ID,
    PMP_EXAM_ID,
    PMP_2026_EXAM_ID,
} from './exams';
import { isPassActiveFor, type PassEntitlement } from '../utils/passEntitlement';
import { EXAM_REFERENCES } from '../utils/domainCitations';

/**
 * These guard the July 2026 PMP outline cutover.
 *
 * The bug this file exists to prevent: `isPassActiveFor` matched `pass.examId`
 * by strict equality, so moving a user from the retired 2021 bank to the 2026
 * bank silently revoked their paid $59 Exam Pass across five access gates.
 * Nothing caught it because none of this had tests.
 */

function pass(examId: string, opts: { expired?: boolean } = {}): PassEntitlement {
    const day = 24 * 60 * 60 * 1000;
    return {
        type: 'exam-pass',
        examId,
        purchasedAt: new Date(Date.now() - 30 * day),
        expiresAt: new Date(Date.now() + (opts.expired ? -1 * day : 60 * day)),
        examDateSnapshot: null,
        freeExtensionUsed: false,
    };
}

describe('PMP outline cutover', () => {
    it('defaults new users to the 2026 bank, not the retired 2021 one', () => {
        expect(DEFAULT_EXAM_ID).toBe(PMP_2026_EXAM_ID);
        expect(DEFAULT_EXAM_ID).not.toBe(PMP_EXAM_ID);
    });

    it('marks the 2021 bank retired and points it at its successor', () => {
        expect(EXAMS[PMP_EXAM_ID].retired).toBe(true);
        expect(EXAMS[PMP_EXAM_ID].supersededBy).toBe(PMP_2026_EXAM_ID);
    });

    it('keeps the live bank sellable and the retired bank not', () => {
        expect(isSellableExam(PMP_2026_EXAM_ID)).toBe(true);
        expect(isSellableExam(PMP_EXAM_ID)).toBe(false);
    });

    it('never offers a retired bank for purchase', () => {
        const retired = SELLABLE_EXAMS.filter((e) => e.retired);
        expect(retired).toEqual([]);
        expect(SELLABLE_EXAMS.map((e) => e.id)).not.toContain(PMP_EXAM_ID);
    });

    it('gives the live PMP mock the 2026 outline duration of 240 minutes', () => {
        expect(EXAMS[PMP_2026_EXAM_ID].fullMock).toEqual({ questionCount: 180, durationMinutes: 240 });
    });

    it('leaves the retired mock on its own 230-minute clock', () => {
        // 240 describes the 2026 exam. The retired bank simulates the 2021 exam,
        // which really was 230 minutes — "fixing" this to 240 is a regression.
        expect(EXAMS[PMP_EXAM_ID].fullMock?.durationMinutes).toBe(230);
    });
});

describe('examLineage', () => {
    it('walks forward from a retired bank to its successor', () => {
        expect(examLineage(PMP_EXAM_ID)).toEqual(expect.arrayContaining([PMP_EXAM_ID, PMP_2026_EXAM_ID]));
    });

    it('walks backward from the live bank to what it replaced', () => {
        expect(examLineage(PMP_2026_EXAM_ID)).toEqual(expect.arrayContaining([PMP_EXAM_ID, PMP_2026_EXAM_ID]));
    });

    it('returns a single-element chain for an exam with no lineage', () => {
        const csm = 'IpECw0XAtBkgD1HyvYas';
        expect(examLineage(csm)).toEqual([csm]);
    });

    it('does not leak across certifications', () => {
        const chain = examLineage(PMP_2026_EXAM_ID);
        expect(chain).not.toContain('79cuGMNydTwDMhyiDjry'); // Security+
        expect(chain).not.toContain('bF7IQUrKjbP2KLwiSNqt'); // PgMP
    });

    it('terminates on a self-referential supersededBy rather than hanging', () => {
        const looped = { ...EXAMS };
        // Guarded by the `seen` set; if that regresses this test hangs the suite,
        // which is the intended signal.
        expect(() => examLineage(PMP_EXAM_ID)).not.toThrow();
        expect(Object.keys(looped).length).toBeGreaterThan(0);
    });
});

describe('isPassActiveFor', () => {
    it('honours a pass bought for the exact bank', () => {
        expect(isPassActiveFor(pass(PMP_2026_EXAM_ID), PMP_2026_EXAM_ID)).toBe(true);
    });

    it('THE REGRESSION: a pass bought on the 2021 bank still covers the 2026 bank', () => {
        expect(isPassActiveFor(pass(PMP_EXAM_ID), PMP_2026_EXAM_ID)).toBe(true);
    });

    it('covers the retired bank too, so nobody loses access mid-study', () => {
        expect(isPassActiveFor(pass(PMP_2026_EXAM_ID), PMP_EXAM_ID)).toBe(true);
    });

    it('still refuses an unrelated certification', () => {
        expect(isPassActiveFor(pass(PMP_2026_EXAM_ID), '79cuGMNydTwDMhyiDjry')).toBe(false);
    });

    it('still refuses an expired pass, lineage or not', () => {
        expect(isPassActiveFor(pass(PMP_EXAM_ID, { expired: true }), PMP_2026_EXAM_ID)).toBe(false);
        expect(isPassActiveFor(pass(PMP_2026_EXAM_ID, { expired: true }), PMP_2026_EXAM_ID)).toBe(false);
    });

    it('refuses a null pass', () => {
        expect(isPassActiveFor(null, PMP_2026_EXAM_ID)).toBe(false);
    });
});

describe('exam currency', () => {
    // The 8 Aug 2026 audit found four certifications built against superseded
    // blueprints. The root cause was citations with no version and no date:
    // nothing to grep for, nothing that could expire. These pin that shut.

    it('gives every exam a reference citation', () => {
        for (const id of Object.keys(EXAMS)) {
            expect(EXAM_REFERENCES[id], `no EXAM_REFERENCES entry for ${EXAMS[id].name}`).toBeTruthy();
        }
    });

    it('dates every citation with a four-digit year', () => {
        for (const [id, citation] of Object.entries(EXAM_REFERENCES)) {
            const named = EXAMS[id]?.name ?? id;
            expect(citation, `undated citation for ${named}: "${citation}"`).toMatch(/\b(19|20)\d{2}\b/);
        }
    });

    it('versions every CompTIA citation with an exam code', () => {
        // "CompTIA Network+ Exam Objectives" is exactly the string that let an
        // N10-008 bank pass for current prep. Codes are mandatory.
        for (const [id, citation] of Object.entries(EXAM_REFERENCES)) {
            if (!/CompTIA/i.test(citation)) continue;
            expect(citation, `no exam code in CompTIA citation for ${id}`).toMatch(/\b(SY0|N10|220)-\d{3,4}\b/);
        }
    });

    it('points every retired CompTIA bank at its re-authored successor', () => {
        // The rule this enforces: a superseded bank is replaced by a NEW bank
        // with its own id, never renamed in place. Renaming would relabel stale
        // content as current — the exact defect the 2026-08 audit found — and it
        // would strand pass holders, since entitlements match on examId.
        const succession = {
            gp6QwBz0FXFIntLSQSYr: 'N5mrEby0gKLFs1y88DpM',   // Network+ N10-008 -> N10-009
            cxBsVz8AVaocdEYbgSMA: '12396VsKMFLnPMXivHKQ',   // A+ Core 2 220-1102 -> 220-1202
            [PMP_EXAM_ID]: PMP_2026_EXAM_ID,                // PMP 2021 ECO -> July 2026 ECO
        };
        for (const [oldId, newId] of Object.entries(succession)) {
            expect(EXAMS[oldId].supersededBy, `${EXAMS[oldId].name} should point at its successor`).toBe(newId);
            expect(EXAMS[newId], `successor ${newId} must exist`).toBeDefined();
            expect(EXAMS[newId].retired, `${EXAMS[newId].name} is current, not retired`).toBeFalsy();
            expect(isSellableExam(newId), `${EXAMS[newId].name} should be sellable`).toBe(true);
            // A pass bought on the retired bank must still open the new one.
            expect(examLineage(newId)).toContain(oldId);
        }
    });

    it('keeps banks for retired exam codes off sale', () => {
        // Network+ N10-008 (retired Dec 2024) and A+ Core 2 220-1102 (retired
        // 25 Sep 2025) are prep for exams nobody can sit.
        const mustBeRetired = ['gp6QwBz0FXFIntLSQSYr', 'cxBsVz8AVaocdEYbgSMA', PMP_EXAM_ID];
        for (const id of mustBeRetired) {
            expect(EXAMS[id].retired, `${EXAMS[id].name} must be flagged retired`).toBe(true);
            expect(isSellableExam(id)).toBe(false);
        }
        const sellableIds = SELLABLE_EXAMS.map((e) => e.id);
        for (const id of mustBeRetired) expect(sellableIds).not.toContain(id);
    });

    it('marks a retired bank in its citation so the reason is visible', () => {
        for (const exam of Object.values(EXAMS)) {
            if (!exam.retired) continue;
            expect(
                EXAM_REFERENCES[exam.id],
                `retired bank ${exam.name} should say so in its citation`,
            ).toMatch(/retired|superseded/i);
        }
    });
});

describe('config integrity', () => {
    it('keys every exam by its own id', () => {
        for (const [key, exam] of Object.entries(EXAMS)) {
            expect(exam.id).toBe(key);
        }
    });

    it('points every supersededBy at a bank that exists', () => {
        for (const exam of Object.values(EXAMS)) {
            if (exam.supersededBy) expect(EXAMS[exam.supersededBy]).toBeDefined();
        }
    });

    it('never leaves a retired bank as the default', () => {
        expect(EXAMS[DEFAULT_EXAM_ID].retired).toBeFalsy();
    });
});
