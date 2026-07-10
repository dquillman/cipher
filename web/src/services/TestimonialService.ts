import { db } from '../firebase';
import {
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    onSnapshot,
    query,
    where,
    type Unsubscribe,
} from 'firebase/firestore';
import { APP_VERSION } from '../version';

export type TestimonialStatus = 'pending_review' | 'approved' | 'rejected';

/** A raw testimonial document as stored at `testimonials/{userId}`. */
export interface TestimonialDoc extends TestimonialSubmission {
    status: TestimonialStatus;
    appVersion?: string;
    approvedAt?: unknown;
    approvedBy?: string | null;
}

export interface TestimonialSubmission {
    userId: string;
    userEmail: string | null;
    userDisplayName: string | null;
    examId: string;
    examName: string;
    rating: number;
    text: string | null;
    consentToShare: boolean;
    triggeredAt: string;
    utmSource: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
}

export const TestimonialService = {
    /**
     * One submission per user — Firestore rule enforces create-only at
     * testimonials/{userId} so duplicate submissions can't overwrite the first.
     */
    submitTestimonial: async (submission: TestimonialSubmission) => {
        await setDoc(doc(db, 'testimonials', submission.userId), {
            ...submission,
            status: 'pending_review',
            appVersion: APP_VERSION,
            createdAt: serverTimestamp(),
        });
    },

    /**
     * Moderation: flip a testimonial's review status. Admin-only — enforced by
     * Firestore rules (only role==='admin' may update the `status` field).
     * `approve` stamps who/when so the audit trail survives.
     */
    setStatus: async (
        userId: string,
        status: TestimonialStatus,
        adminUid: string | null,
    ) => {
        await updateDoc(doc(db, 'testimonials', userId), {
            status,
            approvedAt: status === 'approved' ? serverTimestamp() : null,
            approvedBy: status === 'approved' ? adminUid : null,
        });
    },

    /**
     * Live subscription to every testimonial with the given status, for the
     * moderation queue. Single-field equality filter → no composite index.
     */
    subscribeByStatus: (
        status: TestimonialStatus,
        onChange: (rows: (TestimonialDoc & { id: string })[]) => void,
        onError?: (e: Error) => void,
    ): Unsubscribe => {
        const q = query(
            collection(db, 'testimonials'),
            where('status', '==', status),
        );
        return onSnapshot(
            q,
            (snap) => {
                const rows = snap.docs.map(
                    (d) => ({ id: d.id, ...(d.data() as TestimonialDoc) }),
                );
                onChange(rows);
            },
            (err) => onError?.(err),
        );
    },
};
