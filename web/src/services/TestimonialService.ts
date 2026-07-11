import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

    // Moderation lives in Admin-Core (src/pages/Testimonials.tsx): an admin
    // approves a raw testimonials/{uid} doc there, which publishes a sanitized
    // copy to `published_testimonials`. This product app only SUBMITS raw docs
    // and READS the public mirror (see hooks/useApprovedTestimonials) — it never
    // moderates, so no setStatus/subscribeByStatus here.
};
