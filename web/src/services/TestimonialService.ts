import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { APP_VERSION } from '../version';

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
};
