# SEO Implementation Status & Next Steps

> Owner: Dave · Last updated: 2026-05-25
> Companion to `web/src/components/SeoHead.tsx` and `web/src/config/seo.ts`

## What's already shipped

These changes are already in the repo (uncommitted as of 2026-05-25 — pending Dave's review):

- **`web/public/robots.txt`** — explicit Allow + sitemap reference. Replaces the previous 404→SPA-shell behavior.
- **`web/public/sitemap.xml`** — static sitemap with all 18 public routes.
- **`web/scripts/generate-sitemap.mjs`** — regenerator. Run when routes change: `node web/scripts/generate-sitemap.mjs`.
- **`web/index.html`** — base `<title>`, meta description, OG tags, twitter:card, canonical, sitewide `Organization + WebSite` JSON-LD. Tracking pixels (Meta, LinkedIn, Clarity) deferred via `requestIdleCallback` to stop blocking LCP.
- **`firebase.json`** — HTML `Cache-Control` changed from `no-cache, no-store, must-revalidate` (bad — blocks CDN caching entirely) to `public, max-age=0, must-revalidate` (correct — revalidates on every request without prohibiting intermediate caches).
- **`web/src/components/SeoHead.tsx`** — per-page meta component using React 19's native head-hoisting. No `react-helmet` dep.
- **`web/src/config/seo.ts`** — single source of truth for all per-route meta + the `articleSchema()` helper.
- **Per-page meta wired into 15 routes**: `/`, `/pricing`, `/story`, `/blog`, all 3 LPs, all 8 blog posts. Each has unique `<title>`, `<meta description>`, `<link canonical>`, OG tags, and (for blog posts) `Article` JSON-LD.
- **`/pricing` schema**: `Product` (with two `Offer` entries) + `FAQPage` (4 Q&A) — qualifies for rich results.

## React 19 head-hoisting gotcha (load-bearing)

React 19 hoists `<title>` to `<head>` AND deduplicates it (only one title element wins — the latest render). Good.

But React 19 does NOT deduplicate `<meta>` or `<link>` tags. If `index.html` statically declares `<meta name="description" content="...">` and a page also renders one via SeoHead, BOTH end up in the head. Browsers and crawlers read the first one, so the static one wins — every route appears to have the homepage's meta description.

**Therefore:** `web/index.html` must NOT statically declare any tag that SeoHead emits per-route. The current `index.html` is intentionally stripped — it keeps only the fallback `<title>`, sitewide `<meta name="robots">`, sitewide `<meta name="theme-color">`, the Organization JSON-LD, GA4, and tracking pixels. Adding any meta description, canonical, or OG tag back to `index.html` will silently break per-page meta.

Verified 2026-05-25 via browser test on all 5 sampled routes: 1 description tag per page, 1 canonical per page, 1 OG title per page, all per-route values.

## What's still client-side only

The per-page meta works at runtime via React 19 hoisting. Google's second-pass crawl (which runs JS) sees the correct meta — but the **first-pass crawl** (which only reads source HTML) still sees the sitewide defaults from `index.html`.

For most sites this is fine; Google reliably runs the second-pass crawl on production sites with HTTPS + clean source. The catch is **delay** — second-pass indexing can lag the first by days to weeks, which costs ranking velocity on new pages.

If you want first-pass crawl correctness too, you need server-side rendering or build-time prerendering.

## Prerender — SHIPPED 2026-05-26

Custom Playwright-based prerender script at `web/scripts/prerender.mjs`. Chained into `npm run build`. All 19 public routes get static HTML produced at build time. First-pass Googlebot and social scrapers see real content; no JS execution required.

### How it works

1. `vite build` produces `dist/` with the SPA shell.
2. `node scripts/prerender.mjs` spins up a static HTTP server pointed at `dist/`, launches Playwright Chromium, navigates to each route, waits for the React.lazy() chunk to load (Suspense fallback `.animate-spin` to disappear), then captures the live DOM and writes it to `dist/{route}/index.html`.
3. Firebase Hosting serves static files BEFORE applying rewrites, so `/pricing` is served from `dist/pricing/index.html` (real content) instead of falling through to the SPA shell.

### Build commands

- `npm run build` — full pipeline: tsc → vite build → regenerate sitemap → prerender
- `npm run build:no-prerender` — skip prerender (faster iteration, dev-only)
- `npm run prerender` — re-run prerender against an existing `dist/`

### Build timing

- `vite build` ≈ 10–12s
- Prerender ≈ 60–90s (19 routes × ~3–4s each)
- Total `npm run build` ≈ 1.5–2 min

### Dependencies

- `@playwright/test` (already in devDeps)
- Chromium browser binary — install once via `npx playwright install chromium` (~150 MB download to `%LOCALAPPDATA%\ms-playwright`)

### Verified output (2026-05-26)

- 19/19 routes rendered successfully
- Per-route `<title>`, `<meta name="description">`, `<link rel="canonical">`, OG/Twitter tags, schema (Article/FAQPage/Product/DefinedTermSet/BreadcrumbList) all present in source HTML
- `/pricing` FAQ section visible in static HTML
- `/lp/pmp` serves `og:image=og-pmp.png` with width=1200, height=630

### Catch-all behavior — important

After prerendering, `dist/index.html` is the **rendered homepage**, not the empty SPA shell. If Firebase used `/index.html` as the catch-all rewrite destination, every unknown URL would serve the homepage content — Google would treat them as duplicates of the homepage.

The fix: prerender saves the original Vite-built SPA shell (with a `noindex,nofollow,noarchive` robots meta added) as `dist/_catchall.html`. `firebase.json` rewrites both `/app/**` and the wildcard `**` to `/_catchall.html`. This means:

- **Known prerendered URLs** (`/`, `/pricing`, `/lp/*`, `/blog/*`, etc.) → Firebase static lookup wins, serves the prerendered HTML directly. No rewrite consulted.
- **Auth'd `/app/*` routes** → rewrite to `/_catchall.html`. Browser gets the SPA shell (noindex appropriate for auth'd content), React mounts, RequireAuth + route logic takes over.
- **Genuinely unknown URLs** → rewrite to `/_catchall.html`. Crawlers see noindex (no duplicate-of-homepage issue). React mounts, NotFound renders.

If you add a new public route to App.tsx, **you must also add it to**:
- `web/scripts/prerender.mjs` ROUTES (so it gets a static HTML file)
- `web/scripts/generate-sitemap.mjs` routes (so it's in the sitemap)
- `web/src/config/seo.ts` SEO map (so it has meta + JSON-LD)

If you forget to add it to prerender, the new route falls through to `_catchall.html` (noindex) and Google never indexes it.

### Operational notes

- The prerender browser environment can't auth with Firebase, so you'll see `Firebase Installations: Create Installation request failed with error "403 PERMISSION_DENIED"` warnings during prerender. These are non-blocking — the page still renders.
- Meta Pixel / LinkedIn Insight / Clarity tracking pixels keep firing in the headless browser, but their requests don't affect captured DOM (they're side-effect-only).
- The `noscript` LinkedIn pixel tag in `<body>` is captured intact in every prerendered file — that's correct behavior.
- Routes added to App.tsx must also be added to:
  - `web/scripts/prerender.mjs` ROUTES array
  - `web/scripts/generate-sitemap.mjs` routes array
  - `web/src/config/seo.ts` SEO map (or BLOG_POSTS for articles)

### What this fixes from the original audit

| Finding | Before prerender | After prerender |
|---|---|---|
| First-pass crawler sees empty body | yes | **no — full content in source HTML** |
| Per-route titles | only on 2nd-pass JS execution | **in source HTML** |
| Per-route meta descriptions | only on 2nd-pass | **in source HTML** |
| Canonical tags | only on 2nd-pass | **in source HTML** |
| OG / Twitter cards | only on 2nd-pass | **in source HTML** |
| Article / FAQ / Breadcrumb schema | only on 2nd-pass | **in source HTML** |
| Indexation latency | days to weeks (waiting for 2nd-pass crawl) | **same as the first crawl** |

---

## Previously: how this was researched before shipping

The cleanest path is build-time prerendering — `vite build` produces a `dist/` with one HTML file per route, each containing the fully-rendered initial HTML. Both crawler passes see the right content.

### Option A — `vite-react-ssg` (recommended)

A drop-in SSG plugin for Vite + React Router. Routes you define stay client-side at runtime, but a build-time pass renders each to static HTML.

```bash
cd web
npm install -D vite-react-ssg
```

Then in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePluginSSG } from 'vite-react-ssg';

export default defineConfig({
  plugins: [react(), vitePluginSSG()],
  // ...
});
```

And in `src/main.tsx`, replace `ReactDOM.createRoot(...).render(...)` with `vite-react-ssg`'s hydration helper. (See the plugin docs — the change is ~10 lines.)

Routes that should be prerendered are listed in `src/App.tsx` exactly as today. The plugin walks them at build time, renders each, and writes `dist/{route}/index.html`.

**Tradeoffs:**
- Build time goes from ~30s to ~60–90s (one render per route × 18 routes).
- Auth'd `/app/*` routes shouldn't be prerendered — easy to exclude via the plugin config.
- Anything that reads `window` at module load (like the GA4 init in `src/lib/ga4.ts`) needs a `typeof window !== 'undefined'` guard. We've already done this where it matters; a build pass will surface any remaining ones.

### Option B — Puppeteer post-build crawler

Lighter touch: keep Vite as-is, then run a Puppeteer script after `vite build` that opens the dev server, navigates each route, and saves the rendered HTML to `dist/{route}/index.html`.

```bash
cd web
npm install -D puppeteer
```

Then add a `prerender.mjs` that mirrors `scripts/generate-sitemap.mjs`'s route list.

**Tradeoffs:**
- Slower build (~3–5s per route × 18 routes ≈ ~1 min extra).
- Brittle: timing-dependent renders (animations, image loads) can produce snapshot-dependent HTML.
- Easy to deprecate once you outgrow it — just remove the script.

### Option C — leave it client-rendered

If activated-user count is the metric (not search volume), and most traffic is from paid + LinkedIn (which already loads JS-rendered pages fine), prerendering may be premature optimization.

Recommended threshold for shipping prerendering: when organic search is supposed to drive ≥20% of trial signups, OR when a specific blog post is supposed to rank.

## Verification checklist (run before deploying)

Once prerendering is live (or for the current React-19-hoisting solution), validate:

1. `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://cipherexam.com/pricing | grep "<title>"` → returns the pricing title, not the homepage title.
2. `curl https://cipherexam.com/robots.txt` → returns the actual robots.txt (not the SPA shell).
3. `curl https://cipherexam.com/sitemap.xml` → returns XML.
4. Google Rich Results Test: paste each URL, confirm Article / FAQPage / Product render correctly.
5. PageSpeed Insights: confirm LCP improved after the tracking-pixel defer (target: drop ~200–500ms on slow networks).
6. Search Console: re-submit `https://cipherexam.com/sitemap.xml`. After a week, check the Coverage report — pages should be indexed under their real titles, not duplicates of the homepage.

## Outstanding work

- [ ] Decide on prerender option (A / B / C) and ship if A or B.
- [ ] Add `og-default.png` to `web/public/` (1200×630 social card). Without it, the OG tags reference a missing image — current shares still work but show no card.
- [ ] Add per-LP and per-blog-post OG images for higher social CTR (override `ogImage` in the SEO config).
- [ ] Re-verify property in Google Search Console + submit sitemap once deployed.
- [ ] Connect an SEO MCP (Ahrefs, Semrush, or Google Search Console) so future audits use real ranking data.
