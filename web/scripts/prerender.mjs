#!/usr/bin/env node
/**
 * Prerender — walks the route manifest, captures fully-rendered HTML per route,
 * writes dist/{route}/index.html. First-pass crawlers (text-only Googlebot) and
 * social scrapers (Facebook, LinkedIn) get real content instead of an empty
 * SPA shell.
 *
 * Run AFTER `vite build`. Wired into `npm run build` (see package.json).
 *
 * How it works:
 *   1. Spin up a static file server pointed at dist/.
 *   2. For each public route, navigate Playwright Chromium to that URL.
 *   3. Wait for React to mount + SeoHead to hoist per-page meta to <head>.
 *   4. Serialize the live DOM and write to dist/{route}/index.html.
 *   5. Firebase static-file resolution happens BEFORE rewrites, so dist/pricing/index.html
 *      is served at /pricing instead of the SPA shell.
 *
 * Routes intentionally NOT prerendered:
 *   - /app/*   — auth'd, requires Firebase Auth, would 404 to /login anyway
 *   - /login   — auth-gated UX, not SEO-valuable
 *   - /success — post-purchase, not indexable
 *   - /verify-events — internal admin tool
 *
 * If a route fetches data at mount, this prerender will capture the
 * post-fetch state. Pages depending on user auth (/app/*) are skipped.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4173 + Math.floor(Math.random() * 100); // avoid clash with vite preview

// Public routes to prerender. Keep in sync with App.tsx + sitemap.xml + generate-sitemap.mjs.
const ROUTES = [
  '/',
  '/pricing',
  '/story',
  '/about',
  '/exam-lens',
  '/lp/pmp',
  '/lp/security-plus',
  '/lp/shrm-cp',
  '/lp/csm',
  '/lp/itil',
  '/lp/network-plus',
  '/lp/a-plus-core-2',
  '/lp/six-sigma',
  '/lp/pgmp',
  '/lp/cia',
  '/blog',
  '/blog/study-by-blooms-level',
  '/blog/recall-only-prep-fails',
  '/blog/cognitive-heatmap',
  '/blog/how-certification-exams-think',
  '/blog/why-certification-exam-questions-are-so-confusing',
  '/blog/5-study-mistakes-that-cost-your-certification-exam',
  '/blog/how-ai-explanations-change-the-way-you-study',
  '/blog/first-30-days-certification-study-plan',
  '/blog/pmp-exam-changes-july-2026',
  '/terms',
  '/privacy',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function mimeFor(path) {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  return MIME[path.slice(dot).toLowerCase()] || 'application/octet-stream';
}

// Simple static file server with SPA fallback (for any path that isn't a file, serve index.html).
async function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = join(DIST, urlPath === '/' ? '/index.html' : urlPath);
      try {
        const s = await stat(filePath);
        if (s.isDirectory()) filePath = join(filePath, 'index.html');
      } catch {
        // not a file — SPA fallback
        filePath = join(DIST, 'index.html');
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mimeFor(filePath) });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
  return server;
}

async function main() {
  // Before prerendering overwrites dist/index.html with the rendered homepage,
  // save the original SPA shell with a noindex meta added — this becomes the
  // catch-all fallback served by Firebase for unknown URLs. Without it, Firebase
  // would rewrite every unknown URL to the rendered homepage, and Google would
  // index every unknown URL as a duplicate of the homepage.
  console.log('▶ Saving SPA shell with noindex meta → dist/_catchall.html');
  const shellPath = join(DIST, 'index.html');
  const shellHtml = await readFile(shellPath, 'utf8');
  const catchallHtml = shellHtml.replace(
    '<meta name="theme-color"',
    '<meta name="robots" content="noindex,nofollow,noarchive">\n    <meta name="theme-color"',
  );
  await writeFile(join(DIST, '_catchall.html'), catchallHtml, 'utf8');

  console.log(`▶ Starting static server on :${PORT}`);
  const server = await startStaticServer();

  console.log('▶ Launching Chromium');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (compatible; CipherExamPrerender/1.0)',
  });
  // Suppress network errors that aren't load-bearing for SEO content
  context.on('weberror', (e) => console.warn(`  ⚠ web error: ${e.error().message.slice(0, 80)}`));

  let success = 0;
  let failed = 0;

  for (const route of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route}`;
    const page = await context.newPage();
    try {
      // waitUntil notes:
      //   - 'networkidle' never fires — tracking pixels (Meta/LinkedIn/Clarity) keep
      //     firing background requests so network never goes idle.
      //   - 'load' waits for ALL resources including async fonts + the full pixel
      //     cascade — can exceed 30s on the homepage cold start.
      //   - 'domcontentloaded' fires as soon as HTML is parsed; downstream wait below
      //     handles React hydration. This is the reliable choice.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for the React.lazy() chunk to finish loading + replace the Suspense
      // fallback spinner (.animate-spin) with the actual route content. This is the
      // reliable signal that hydration is complete.
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          if (!root || root.children.length === 0) return false;
          return !root.querySelector('.animate-spin');
        },
        { timeout: 30000 },
      );
      // Extra settle: React 19 head hoisting + final layout paint
      await page.waitForTimeout(750);

      // Dedupe meta/link tags. React 19 hoists meta tags from components, but when
      // route transitions happen (e.g., BrowserRouter briefly evaluates Landing
      // before resolving to /lp/pmp), the unmounted component's hoisted tags can
      // remain. Crawlers read the FIRST occurrence per name/property, so the stale
      // Landing tags would win over the route-specific ones. Strip duplicates here,
      // keeping the LAST occurrence (= the correct per-route SeoHead emission).
      await page.evaluate(() => {
        // Dedupe meta[name=...] and meta[property=...] — keep last occurrence
        const metaKeep = new Map();
        document.querySelectorAll('meta[name], meta[property]').forEach((m) => {
          const key = m.getAttribute('property') || m.getAttribute('name');
          if (key) metaKeep.set(key, m);
        });
        document.querySelectorAll('meta[name], meta[property]').forEach((m) => {
          const key = m.getAttribute('property') || m.getAttribute('name');
          if (key && metaKeep.get(key) !== m) m.remove();
        });
        // Dedupe link[rel=canonical] specifically — only one should ever exist
        const canons = document.querySelectorAll('link[rel="canonical"]');
        if (canons.length > 1) {
          for (let i = 0; i < canons.length - 1; i++) canons[i].remove();
        }

        // Strip runtime-injected modulepreload hints for heavy DECORATIVE lazy
        // chunks. Vite injects these <link> tags when a dynamic chunk loads
        // during the prerender session; baking them into the static HTML makes
        // every real visitor eagerly download ~570KB of below-the-fold WebGL/
        // animation code (three-vendor + HeroCanvas + gsap-vendor) on first
        // paint, defeating the lazy-loading. Route/content chunks keep their
        // preloads — those genuinely speed up LCP.
        const HEAVY_DECOR = ['three-vendor', 'HeroCanvas', 'gsap-vendor'];
        document.querySelectorAll('link[rel="modulepreload"]').forEach((l) => {
          const href = l.getAttribute('href') || '';
          if (HEAVY_DECOR.some((n) => href.includes(n))) l.remove();
        });
      });

      const html = await page.content();
      const outPath =
        route === '/'
          ? join(DIST, 'index.html')
          : join(DIST, route.replace(/^\//, ''), 'index.html');
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, html, 'utf8');
      console.log(`  ✓ ${route} → ${outPath.replace(DIST, 'dist')} (${(html.length / 1024).toFixed(1)} KB)`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${route} FAILED: ${err.message.slice(0, 120)}`);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n✓ Prerender complete: ${success} success, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Prerender crashed:', err);
  process.exit(1);
});
