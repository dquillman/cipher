#!/usr/bin/env node
/**
 * Regenerates web/public/sitemap.xml from scripts/seo-routes.mjs.
 * Wired into `npm run build`; also runnable standalone:
 *   node web/scripts/generate-sitemap.mjs
 *
 * Routes come from ONE manifest (scripts/seo-routes.mjs) shared with
 * prerender.mjs and check-routes.mjs. Do not add a route list here.
 *
 * <lastmod> is the date of the LAST COMMIT that touched the page's source file,
 * not today's date. Previously every build stamped every URL with today, which
 * told Google all 23 pages change daily. Google discounts (and eventually
 * ignores) lastmod it can see is untrue, which costs the sitemap the one signal
 * it has. If git isn't available, lastmod is omitted rather than faked.
 *
 * CI NOTE: a shallow clone (actions/checkout defaults to depth 1) collapses every
 * file's history to the tip commit, so every route would get the same date and we
 * would be back to faking it. This script detects that and omits lastmod instead.
 * To get real dates in CI, use `actions/checkout` with `fetch-depth: 0`.
 */
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEO_ROUTES } from './seo-routes.mjs';
import { parseAppRoutes } from './app-routes.mjs';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const BASE = 'https://cipherexam.com';

/** True when git history is truncated, making per-file dates meaningless. */
async function isShallowClone() {
  try {
    const { stdout } = await exec('git', ['rev-parse', '--is-shallow-repository'], { cwd: REPO_ROOT });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/** Last commit date (YYYY-MM-DD) for a repo file, or null. */
async function lastCommitDate(file) {
  if (!file) return null;
  try {
    const { stdout } = await exec('git', ['log', '-1', '--format=%cs', '--', file], { cwd: REPO_ROOT });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

const shallow = await isShallowClone();
if (shallow) {
  console.warn('⚠ sitemap: shallow git clone — omitting <lastmod> rather than stamping a fake date.');
  console.warn('  Use `fetch-depth: 0` in CI checkout to restore real per-page dates.');
}

const appRoutes = await parseAppRoutes();
const fileFor = new Map(appRoutes.map((r) => [r.path, r.file]));

const entries = [];
for (const r of SEO_ROUTES) {
  entries.push({ ...r, lastmod: shallow ? null : await lastCommitDate(fileFor.get(r.path)) });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((r) =>
    [
      '  <url>',
      `    <loc>${BASE}${r.path}</loc>`,
      r.lastmod ? `    <lastmod>${r.lastmod}</lastmod>` : null,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  .join('\n')}
</urlset>
`;

const out = join(__dirname, '..', 'public', 'sitemap.xml');
await writeFile(out, xml, 'utf8');

const dated = entries.filter((e) => e.lastmod).length;
console.log(`✓ sitemap: ${entries.length} URLs (${dated} with real lastmod) → ${out}`);
