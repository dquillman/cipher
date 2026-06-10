import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';

/**
 * 404 — Renders for any route not matched in App.tsx.
 *
 * Critical SEO behavior: `noindex` ensures crawlers don't accumulate URLs that
 * 200-with-this-page in the index. We can't return a true HTTP 404 from a
 * client-rendered SPA (Firebase Hosting rewrites everything to index.html
 * with 200 OK), but `<meta name="robots" content="noindex,nofollow">` is the
 * documented Google-recommended workaround.
 *
 * If we move to SSR/prerendering, swap this for a real 404 response.
 */
export default function NotFound() {
  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        title="Page Not Found · CipherExam"
        description="The page you're looking for doesn't exist on cipherexam.com."
        canonical="/404"
        noindex
      />
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-3">
            404
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight mb-4">
            That page doesn't exist.
          </h1>
          <p className="text-slate-400 leading-relaxed mb-8">
            The URL may be stale or mistyped. Here's where you probably meant to go:
          </p>

          <ul className="space-y-3 text-left mb-10">
            <li>
              <Link
                to="/"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                Home — what CipherExam does
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                Pricing — Free or $19/month Pro
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                Blog — cert prep writing
              </Link>
            </li>
            <li>
              <Link
                to="/exam-lens"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
              >
                Exam Lens — reasoning frameworks per cert
              </Link>
            </li>
          </ul>

          <Link
            to="/login?mode=signup"
            className="inline-block rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition-colors"
          >
            Start a Free 7-Day Trial
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
