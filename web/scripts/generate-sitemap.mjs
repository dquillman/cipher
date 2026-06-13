#!/usr/bin/env node
/**
 * Regenerates web/public/sitemap.xml from a static route manifest.
 * Run before each deploy if routes change: `node web/scripts/generate-sitemap.mjs`
 *
 * If you add a public route in web/src/App.tsx, add it below.
 * Auth'd routes under /app/* are intentionally excluded (also disallowed in robots.txt).
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://cipherexam.com';

const routes = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { path: '/story', changefreq: 'monthly', priority: 0.7 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/lp/pmp', changefreq: 'weekly', priority: 0.9 },
  { path: '/lp/security-plus', changefreq: 'weekly', priority: 0.9 },
  { path: '/lp/shrm-cp', changefreq: 'weekly', priority: 0.9 },
  { path: '/lp/csm', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/itil', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/network-plus', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/a-plus-core-2', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/six-sigma', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/pgmp', changefreq: 'weekly', priority: 0.8 },
  { path: '/lp/cia', changefreq: 'weekly', priority: 0.8 },
  { path: '/blog', changefreq: 'weekly', priority: 0.8 },
  { path: '/exam-lens', changefreq: 'monthly', priority: 0.85 },
  { path: '/blog/study-by-blooms-level', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/recall-only-prep-fails', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/cognitive-heatmap', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/how-certification-exams-think', changefreq: 'monthly', priority: 0.8 },
  { path: '/blog/why-certification-exam-questions-are-so-confusing', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/5-study-mistakes-that-cost-your-certification-exam', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/how-ai-explanations-change-the-way-you-study', changefreq: 'monthly', priority: 0.7 },
  { path: '/blog/first-30-days-certification-study-plan', changefreq: 'monthly', priority: 0.7 },
  { path: '/terms', changefreq: 'yearly', priority: 0.2 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.2 },
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${BASE}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const out = join(__dirname, '..', 'public', 'sitemap.xml');
await writeFile(out, xml, 'utf8');
console.log(`Wrote ${routes.length} URLs to ${out}`);
