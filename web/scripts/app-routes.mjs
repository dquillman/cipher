/**
 * Parses web/src/App.tsx and returns the PUBLIC routes it actually declares,
 * each mapped back to the source file that renders it.
 *
 * Used by:
 *   - scripts/check-routes.mjs      (drift guard: App.tsx vs scripts/seo-routes.mjs)
 *   - scripts/generate-sitemap.mjs  (real <lastmod> from that file's last commit)
 *
 * "Public" = declared before the <PublicOnly> / <RequireAuth> boundaries. Routes
 * nested under /app/** are auth'd and never indexable, so they are skipped.
 *
 * This is a regex parser, not a TS parser. It only needs to understand the two
 * shapes App.tsx actually uses:
 *   const Foo = lazy(() => import("./pages/Foo"));
 *   <Route path="/foo" element={<Foo />} />
 * If App.tsx ever adopts a different shape, check-routes.mjs fails loudly rather
 * than silently under-reporting — which is the whole point of the guard.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_TSX = join(__dirname, '..', 'src', 'App.tsx');

export async function parseAppRoutes() {
  const src = await readFile(APP_TSX, 'utf8');

  // Everything from the first auth boundary onward is non-public.
  const boundary = src.search(/<(PublicOnly|RequireAuth)\b/);
  const publicSrc = boundary === -1 ? src : src.slice(0, boundary);

  // component name -> source module path (as written in the import)
  const lazyImports = new Map();
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)/g)) {
    lazyImports.set(m[1], m[2]);
  }
  for (const m of src.matchAll(/^import\s+(\w+)\s+from\s+["'](\.[^"']+)["']/gm)) {
    if (!lazyImports.has(m[1])) lazyImports.set(m[1], m[2]);
  }

  const routes = [];
  for (const m of publicSrc.matchAll(/<Route\s+path=\{?["']([^"']+)["']\}?\s+element=\{<(\w+)\b/g)) {
    const [, path, component] = m;
    if (!path.startsWith('/')) continue;      // nested (auth'd) child route
    if (path.includes('*') || path.includes(':')) continue; // wildcard / param
    routes.push({
      path,
      component,
      file: resolveSource(lazyImports.get(component)),
    });
  }
  return routes;
}

/** "./pages/Landing" -> "src/pages/Landing.tsx" (repo-root relative, for git). */
function resolveSource(modulePath) {
  if (!modulePath) return null;
  const rel = modulePath.replace(/^\.\//, '');
  return `web/src/${rel}.tsx`;
}
