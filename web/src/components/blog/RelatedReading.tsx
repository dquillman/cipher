import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../config/seo';

/**
 * RelatedReading — small footer block of 2–3 internal links to other blog posts
 * and (optionally) one LP. Improves topical-cluster signal for SEO and gives
 * readers a clear next step.
 *
 * Usage:
 *   <RelatedReading
 *     posts={['studyByBloomsLevel', 'recallOnlyPrepFails']}
 *     lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
 *   />
 *
 * Drop near the bottom of an article, just before the global CTA.
 */
export type RelatedReadingProps = {
  /** Keys of BLOG_POSTS to link to. Render order = array order. */
  posts: Array<keyof typeof BLOG_POSTS>;
  /** Optional LP plug. Use when the article's audience maps to a single exam. */
  lp?: { href: string; label: string };
};

export default function RelatedReading({ posts, lp }: RelatedReadingProps) {
  return (
    <aside
      className="mt-16 border-t border-slate-800 pt-8"
      aria-label="Related reading"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 mb-5">
        Keep reading
      </h2>
      <ul className="space-y-3">
        {posts.map((key) => {
          const p = BLOG_POSTS[key];
          if (!p) return null;
          return (
            <li key={key}>
              <Link
                to={p.canonical}
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                {p.title.replace(' · CipherExam', '')}
              </Link>
              <span className="block text-sm text-slate-500 mt-1">{p.description}</span>
            </li>
          );
        })}
      </ul>
      {lp ? (
        <p className="mt-6 text-slate-400">
          Ready to apply this?{' '}
          <Link
            to={lp.href}
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
          >
            {lp.label}
          </Link>
          .
        </p>
      ) : null}
    </aside>
  );
}
