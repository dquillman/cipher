import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_ROUTE_PATHS } from './seo-routes.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const site = 'https://cipherexam.com';
const errors = [];
const fail = (route, message) => errors.push(`${route}: ${message}`);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
for (const route of SEO_ROUTE_PATHS) {
  const file = resolve(root, `.${route}`, 'index.html');
  if (!existsSync(file)) { fail(route, 'missing prerendered HTML'); continue; }
  const html = readFileSync(file, 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const links = head.match(/<link\b[^>]*>/gi) ?? [];
  const canonicals = links.filter(t => attr(t, 'rel') === 'canonical');
  if (canonicals.length !== 1 || attr(canonicals[0], 'href') !== site + route) fail(route, 'expected one self canonical');
  const metas = head.match(/<meta\b[^>]*>/gi) ?? [];
  const robots = metas.filter(t => attr(t, 'name')?.toLowerCase() === 'robots');
  const directives = (robots[0] && attr(robots[0], 'content')) ?? '';
  if (robots.length !== 1 || !/(?:^|[ ,])index(?:$|[ ,])/i.test(directives) || /noindex|none/i.test(directives)) fail(route, 'missing or blocking robots directive');
  if ((head.match(/<title\b/gi) ?? []).length !== 1) fail(route, 'expected one title');
  if ((html.match(/<h1\b/gi) ?? []).length !== 1) fail(route, 'expected one rendered H1');
  if (!sitemap.includes(`<loc>${site + route}</loc>`)) fail(route, 'missing from sitemap');
  let products = 0;
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (value['@type'] === 'Product') {
      products++;
      const images = Array.isArray(value.image) ? value.image : [value.image];
      if (!images.length || images.some(x => typeof x !== 'string' || !x.startsWith(site + '/') || !existsSync(resolve(root, '.' + new URL(x).pathname)))) fail(route, 'Product needs an absolute image URL backed by a bundled file');
    }
    Object.values(value).forEach(x => Array.isArray(x) ? x.forEach(walk) : walk(x));
  };
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attr(match[1], 'type') !== 'application/ld+json') continue;
    try { walk(JSON.parse(match[2])); } catch { fail(route, 'invalid JSON-LD'); }
  }
  if (route === '/pricing' && products !== 1) fail(route, 'expected one pricing Product');
}
const catchall = readFileSync(resolve(root, '_catchall.html'), 'utf8');
if (!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(catchall)) fail('_catchall', 'SPA shell must remain noindex');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`SEO output passed for all ${SEO_ROUTE_PATHS.length} public routes and the noindex fallback.`);
