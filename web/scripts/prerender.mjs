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
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4173 + Math.floor(Math.random() * 100); // avoid clash with vite preview

// How long to wait for the hydration signal before falling back to the
// "did content actually render?" check. The chart/WebGL-heavy routes are the
// slow ones, so this is sized for them on a cold, loaded machine.
const READY_TIMEOUT_MS = 45000;
// Rendered text below this is a shell or an error page, not an article.
const MIN_CONTENT_CHARS = 500;
// Retry once — a single timeout is usually machine load, not a broken route.
const MAX_ATTEMPTS = 2;

// Public routes to prerender. Keep in sync with App.tsx + sitemap.xml + generate-sitemap.mjs.
const ROUTES = [
  '/',
  '/pricing',
  '/story',
  '/about',
  '/exam-lens',
  '/lp/pmp',
  '/lp/security-plus',
  // Restored: these LPs now market the re-authored N10-009 and 220-1202 banks,
  // the codes CompTIA currently tests.
  '/lp/network-plus',
  '/lp/a-plus-core-2',
  '/compare/pocketprep-alternative',
  '/compare/best-pmp-exam-simulator-2026',
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
  const failedRoutes = [];

  // One route render attempt. Returns the serialized HTML, or throws.
  async function renderRoute(route) {
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
      //
      // The spinner predicate is a proxy for "route rendered", not proof of it, and
      // it produces FALSE FAILURES: the heaviest routes (charts-vendor + three-vendor,
      // ~850KB) can finish painting real content while some transient spinner is still
      // in the tree. So on timeout we fall back to asking the question we actually
      // care about — did substantive content render? — and only fail if it didn't.
      // Without this, a route ships as "failed" despite being perfectly renderable.
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root');
            if (!root || root.children.length === 0) return false;
            return !root.querySelector('.animate-spin');
          },
          { timeout: READY_TIMEOUT_MS },
        );
      } catch (readyErr) {
        const rendered = await page.evaluate((minText) => {
          const root = document.getElementById('root');
          if (!root) return false;
          const text = (root.innerText || '').trim();
          return Boolean(root.querySelector('h1')) && text.length >= minText;
        }, MIN_CONTENT_CHARS);
        if (!rendered) throw readyErr;
        console.warn(`  ⚠ ${route} spinner never cleared, but content rendered — accepting`);
      }
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

      return await page.content();
    } finally {
      await page.close();
    }
  }

  for (const route of ROUTES) {
    const outPath =
      route === '/'
        ? join(DIST, 'index.html')
        : join(DIST, route.replace(/^\//, ''), 'index.html');

    let html = null;
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        html = await renderRoute(route);
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_ATTEMPTS) {
          console.warn(`  ↻ ${route} attempt ${attempt} failed, retrying: ${err.message.slice(0, 80)}`);
        }
      }
    }

    if (html === null) {
      // Remove any output from a PREVIOUS build. Vite only clears dist when it
      // owns the directory, so without this a failed route silently keeps last
      // build's HTML — which references asset hashes that no longer exist,
      // serving a white screen that looks like a successful deploy. Better to
      // have no file: Firebase then falls through to _catchall.html, which at
      // least boots the SPA (noindex, but functional).
      await rm(outPath, { force: true });
      console.error(`  ✗ ${route} FAILED after ${MAX_ATTEMPTS} attempts: ${lastErr.message.slice(0, 120)}`);
      console.error(`    cleared stale ${outPath.replace(DIST, 'dist')} so it cannot ship`);
      failedRoutes.push(route);
      failed++;
      continue;
    }

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');
    console.log(`  ✓ ${route} → ${outPath.replace(DIST, 'dist')} (${(html.length / 1024).toFixed(1)} KB)`);
    success++;
  }

  await browser.close();
  server.close();

  console.log(`\n✓ Prerender complete: ${success} success, ${failed} failed`);
  if (failed > 0) {
    console.error(`\n✗ Not deployable — these routes have NO prerendered HTML and will`);
    console.error(`  fall through to the noindex SPA shell:\n    ${failedRoutes.join('\n    ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Prerender crashed:', err);
  process.exit(1);
});
