#!/usr/bin/env node
/**
 * Drift guard. Fails the build when App.tsx and scripts/seo-routes.mjs disagree.
 *
 * This exists because they DID disagree, silently, for weeks: /lp/shrm-cp was a
 * live route, got indexed by Google, was later deleted from App.tsx, and neither
 * the sitemap nor the prerender manifest ever mentioned it. Google kept the URL
 * and started getting a 200 noindex shell — a soft 404 with no way to notice.
 *
 * Two failure modes, both caught here:
 *   MISSING  — a public route exists in App.tsx but isn't in seo-routes.mjs.
 *              It will never be prerendered or listed in the sitemap.
 *   ORPHANED — seo-routes.mjs lists a path App.tsx no longer serves.
 *              Prerender will emit a page for a route that 404s in the SPA.
 *
 * Run: node scripts/check-routes.mjs   (wired into `npm run build`)
 */
import { parseAppRoutes } from './app-routes.mjs';
import { SEO_ROUTE_PATHS, EXCLUDED_ROUTES } from './seo-routes.mjs';

const appRoutes = await parseAppRoutes();
const appPaths = new Set(appRoutes.map((r) => r.path));
const seoPaths = new Set(SEO_ROUTE_PATHS);

const missing = [...appPaths].filter((p) => !seoPaths.has(p) && !EXCLUDED_ROUTES.has(p));
const orphaned = [...seoPaths].filter((p) => !appPaths.has(p));

if (appRoutes.length === 0) {
  console.error('✗ check-routes: parsed 0 routes from App.tsx.');
  console.error('  The <Route> or lazy() syntax changed — fix scripts/app-routes.mjs.');
  process.exit(1);
}

let bad = false;

if (missing.length) {
  bad = true;
  console.error(`\n✗ ${missing.length} public route(s) in App.tsx are NOT in scripts/seo-routes.mjs:`);
  for (const p of missing) console.error(`    ${p}`);
  console.error('  These will not be prerendered and will not appear in sitemap.xml.');
  console.error('  Fix: add them to SEO_ROUTES, or to EXCLUDED_ROUTES if intentionally hidden.');
}

if (orphaned.length) {
  bad = true;
  console.error(`\n✗ ${orphaned.length} path(s) in scripts/seo-routes.mjs no longer exist in App.tsx:`);
  for (const p of orphaned) console.error(`    ${p}`);
  console.error('  Prerender would ship HTML for a route the SPA 404s.');
  console.error('  Fix: remove from SEO_ROUTES, and add a 301 in firebase.json if it was ever indexed.');
}

if (bad) process.exit(1);

console.log(`✓ check-routes: ${seoPaths.size} indexable routes, in sync with App.tsx`);
