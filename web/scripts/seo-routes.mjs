/**
 * SINGLE SOURCE OF TRUTH for public, indexable routes.
 *
 * Imported by:
 *   - scripts/generate-sitemap.mjs  (writes public/sitemap.xml)
 *   - scripts/prerender.mjs         (writes dist/{route}/index.html)
 *   - scripts/check-routes.mjs      (fails the build if App.tsx drifts from this list)
 *
 * WHY THIS FILE EXISTS
 * Before this, the route list was copy-pasted into generate-sitemap.mjs and
 * prerender.mjs independently. They drifted: /lp/shrm-cp shipped, got indexed by
 * Google, was later removed from App.tsx, and neither manifest ever knew. The
 * result was an indexed URL serving a 200 noindex shell (a soft 404).
 *
 * Add a public route in App.tsx  ->  add it here. check-routes.mjs enforces it.
 *
 * Deliberately excluded (also Disallow'd in public/robots.txt):
 *   /app/**  /login  /signin  /success  /verify-events  /dev/**
 */

/** @typedef {{ path: string, changefreq: string, priority: number }} SeoRoute */

/** @type {SeoRoute[]} */
export const SEO_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { path: '/story', changefreq: 'monthly', priority: 0.7 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/exam-lens', changefreq: 'monthly', priority: 0.85 },

  // Landing pages — one per exam bank we actually ship.
  { path: '/lp/pmp', changefreq: 'weekly', priority: 0.9 },
  { path: '/lp/security-plus', changefreq: 'weekly', priority: 0.9 },
  { path: '/lp/network-plus', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/a-plus-core-2', changefreq: 'weekly', priority: 0.8 },

  // Comparison pages — highest commercial intent on the site.
  { path: '/compare/best-pmp-exam-simulator-2026', changefreq: 'monthly', priority: 0.85 },
  { path: '/compare/pocketprep-alternative', changefreq: 'monthly', priority: 0.8 },

  { path: '/blog', changefreq: 'weekly', priority: 0.8 },
  { path: '/blog/study-by-blooms-level', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/recall-only-prep-fails', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/cognitive-heatmap', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/how-certification-exams-think', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/pmp-exam-changes-july-2026', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/why-certification-exam-questions-are-so-confusing', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/5-study-mistakes-that-cost-your-certification-exam', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/how-ai-explanations-change-the-way-you-study', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/first-30-days-certification-study-plan', changefreq: 'monthly', priority: 0.7 },

  { path: '/terms', changefreq: 'yearly', priority: 0.2 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.2 },
];

/**
 * Public App.tsx routes that must NOT appear in the sitemap or be prerendered.
 * check-routes.mjs uses this to tell "intentionally excluded" from "you forgot".
 */
export const EXCLUDED_ROUTES = new Set([
  '/login',
  '/signin',
  '/success',
  '/verify-events',
  '/dev/daylight',
]);

/** Just the paths, in manifest order. */
export const SEO_ROUTE_PATHS = SEO_ROUTES.map((r) => r.path);
