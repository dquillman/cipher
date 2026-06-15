import { Star } from 'lucide-react';
import { usePublishedTestimonials } from '../hooks/usePublishedTestimonials';

/**
 * Renders admin-approved, user-consented testimonials from the public
 * `published_testimonials` collection (first name + quote + rating + exam only).
 *
 * Renders NOTHING when there are none, so it's safe to drop anywhere — the page
 * is unchanged until real testimonials are approved in Admin-Core. Do NOT place
 * this on PMI-product LPs (PMP / PgMP): per the PMI no-contributor-name rule
 * those surfaces use only curated pmi-safe quotes. (LandingShell already gates
 * it to non-PMI exams.)
 */
export default function PublishedTestimonials({
    max = 6,
    heading = 'What CipherExam users are saying',
    className = '',
}: {
    max?: number;
    heading?: string;
    className?: string;
}) {
    const items = usePublishedTestimonials(max);
    if (items.length === 0) return null;

    return (
        <section className={`mx-auto max-w-5xl px-4 py-12 ${className}`} aria-labelledby="published-testimonials-heading">
            <h2
                id="published-testimonials-heading"
                className="text-center text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl font-display"
            >
                {heading}
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                    <li key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                        <div className="mb-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <blockquote className="text-base leading-relaxed text-slate-300">
                            <span aria-hidden="true" className="text-brand-400 text-xl leading-none">&ldquo;</span>
                            <span className="italic">{t.quote}</span>
                            <span aria-hidden="true" className="text-brand-400 text-xl leading-none">&rdquo;</span>
                        </blockquote>
                        <figcaption className="mt-5 text-xs font-semibold tracking-wide text-slate-400">
                            — {t.firstName}{t.examName ? ` · ${t.examName}` : ''}
                        </figcaption>
                    </li>
                ))}
            </ul>
        </section>
    );
}
