/**
 * Meta length guard. Wired into `npm run build` (see package.json), so a
 * description that would be truncated in the SERP fails the build instead of
 * shipping.
 *
 * Why: the homepage description used to run 206 characters. Google cut it at
 * ~160, which happened to drop "Free 14-day trial, no credit card" — the
 * strongest thing in it. Not a ranking problem; a click-through one.
 *
 * Bands (characters, not pixels — close enough for a guard and stable across
 * fonts):
 *   title        25–60
 *   description  70–160
 *
 * The ceiling is the point. The floor only catches placeholder copy.
 * SHORT_OK exempts utility pages whose meta is deliberately one line.
 */
import { describe, expect, it } from 'vitest';
import { SEO, BLOG_POSTS } from './seo';

const TITLE_MIN = 25;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

/** Legal/utility pages: no marketing copy to write, floor does not apply. */
const SHORT_OK = new Set(['terms', 'privacy']);

const entries: Array<[string, { title: string; description: string }]> = [
  ...Object.entries(SEO).map(([k, v]) => [`SEO.${k}`, v] as [string, { title: string; description: string }]),
  ...Object.entries(BLOG_POSTS).map(([k, v]) => [`BLOG_POSTS.${k}`, v] as [string, { title: string; description: string }]),
];

describe('SEO meta lengths', () => {
  it.each(entries)('%s title fits the SERP', (key, meta) => {
    expect(meta.title.length, `${key} title is ${meta.title.length} chars: ${meta.title}`)
      .toBeLessThanOrEqual(TITLE_MAX);
    if (!SHORT_OK.has(key.split('.')[1])) {
      expect(meta.title.length, `${key} title is only ${meta.title.length} chars`)
        .toBeGreaterThanOrEqual(TITLE_MIN);
    }
  });

  it.each(entries)('%s description fits the SERP', (key, meta) => {
    expect(
      meta.description.length,
      `${key} description is ${meta.description.length} chars — everything past ${DESC_MAX} is cut: ${meta.description}`,
    ).toBeLessThanOrEqual(DESC_MAX);
    if (!SHORT_OK.has(key.split('.')[1])) {
      expect(meta.description.length, `${key} description is only ${meta.description.length} chars`)
        .toBeGreaterThanOrEqual(DESC_MIN);
    }
  });

  it('covers every entry (guard against an empty sweep)', () => {
    expect(entries.length).toBeGreaterThan(20);
  });
});
