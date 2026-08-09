import { Timestamp } from 'firebase/firestore';
import { examLineage } from '../config/exams';

/**
 * 90-Day Exam Pass entitlement — mirrors users/{uid}.entitlement written by
 * the backend (see docs/exam-pass-spec.md).
 *
 * { type: 'exam-pass', examId, purchasedAt, expiresAt, examDateSnapshot, freeExtensionUsed }
 */
export interface PassEntitlement {
    type: 'exam-pass';
    examId: string;
    purchasedAt: Date;
    expiresAt: Date;
    examDateSnapshot: Date | null;
    freeExtensionUsed: boolean;
}

/** Defensive Timestamp/Date/seconds → Date conversion. */
function toDateOrNull(val: unknown): Date | null {
    if (val == null) return null;
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof (val as any)?.toDate === 'function') return (val as any).toDate();
    if (typeof (val as any)?.seconds === 'number') return new Date((val as any).seconds * 1000);
    return null;
}

/**
 * Parses the raw `entitlement` field off the user doc into a typed
 * PassEntitlement, or null if absent/malformed/not an exam pass.
 */
export function parsePassEntitlement(raw: unknown): PassEntitlement | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;
    if (data.type !== 'exam-pass') return null;
    if (typeof data.examId !== 'string' || !data.examId) return null;

    const purchasedAt = toDateOrNull(data.purchasedAt);
    const expiresAt = toDateOrNull(data.expiresAt);
    if (!purchasedAt || !expiresAt) return null;

    return {
        type: 'exam-pass',
        examId: data.examId,
        purchasedAt,
        expiresAt,
        examDateSnapshot: toDateOrNull(data.examDateSnapshot),
        freeExtensionUsed: data.freeExtensionUsed === true,
    };
}

/**
 * True if the pass covers `examId` and has not expired.
 *
 * Coverage is matched across the exam's LINEAGE, not by strict id equality. A
 * pass is bought for a certification, not for a Firestore document: when PMI
 * replaced the PMP outline on 9 July 2026 and the bank was rebuilt under a new
 * id, strict equality would have silently revoked every live PMP pass the
 * moment its holder moved to the current bank. Five gates depend on this
 * function (App, MockExamGuard, Quiz, SimulatorIntro, BloomHeatmap), so the
 * failure would have read as "my paid access vanished".
 *
 * See examLineage in config/exams.ts for how the chain is declared.
 */
export function isPassActiveFor(pass: PassEntitlement | null, examId: string): boolean {
    if (!pass) return false;
    if (pass.expiresAt.getTime() <= Date.now()) return false;
    if (pass.examId === examId) return true;
    return examLineage(examId).includes(pass.examId);
}
