import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { excludeQuarantined } from '../utils/questionStatus';

/**
 * Fetch question documents by id in PARALLEL, preserving input order and
 * skipping ids that don't exist. Replaces the per-id `await getDoc` loops that
 * cost one full network round-trip per question — a 20-question resume paid
 * ~20 serial RTTs (2-3s on a typical connection); this pays ~1.
 */
export async function fetchQuestionDocsByIds<T>(ids: string[]): Promise<T[]> {
    const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'questions', id))));
    const docs = snaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() } as T));
    // Every by-id path — smart quiz, simulator, verbal mode — funnels through
    // here, so one filter covers all of them.
    return excludeQuarantined(docs as Array<T & { status?: string }>) as T[];
}
