import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface PublishedTestimonial {
    id: string;
    firstName: string;
    quote: string;
    rating: number;
    examName: string;
}

/**
 * Reads the PUBLIC `published_testimonials` collection — sanitized, admin-approved
 * + user-consented testimonials (first name + quote + rating + exam only, no PII).
 * Populated automatically when an admin approves a consented testimonial in
 * Admin-Core. Public-read by Firestore rule, so this works for anonymous visitors.
 *
 * Returns [] on any error (or before the rule/collection exists) so callers can
 * simply render nothing — the site degrades to its curated testimonials.
 */
export function usePublishedTestimonials(max = 6): PublishedTestimonial[] {
    const [items, setItems] = useState<PublishedTestimonial[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const q = query(
                    collection(db, 'published_testimonials'),
                    orderBy('publishedAt', 'desc'),
                    limit(max)
                );
                const snap = await getDocs(q);
                if (cancelled) return;
                const rows = snap.docs
                    .map((d) => {
                        const data = d.data() as Partial<PublishedTestimonial>;
                        return {
                            id: d.id,
                            firstName: (data.firstName || 'CipherExam user').trim(),
                            quote: (data.quote || '').trim(),
                            rating: typeof data.rating === 'number' ? data.rating : 5,
                            examName: (data.examName || '').trim(),
                        };
                    })
                    .filter((t) => t.quote.length > 0);
                setItems(rows);
            } catch {
                if (!cancelled) setItems([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [max]);

    return items;
}
