/**
 * cleanHead — de-duplicates the <head> of a prerendered page, as a STRING pass.
 *
 * WHY NOT DO THIS IN THE DOM
 * The old prerender removed duplicate tags with page.evaluate() before calling
 * page.content(). It didn't hold: React 19 owns the tags it hoists into <head>,
 * so on its next commit it re-inserted the nodes we had just deleted, and the
 * serialized HTML shipped with the duplicates anyway. Every live page went out
 * with 3 <title> elements, an empty <link rel="canonical"> ahead of the real
 * one, and an empty <meta name="robots"> ahead of the real one.
 *
 * Two <link rel="canonical"> is the one that actually costs us. Google's 2013
 * post "5 common mistakes with rel=canonical" states that when more than one is
 * specified, all of them are ignored. That post now carries Google's
 * outdated-content banner and the current canonicalization docs do not restate
 * the rule — so treat it as the last explicit word on the subject rather than
 * live guidance. Either way it is not a coin worth flipping on every page of
 * the site, when SeoHead exists specifically to emit that one signal.
 *
 * So: let React render whatever it wants, serialize, and clean the string. The
 * string is the artifact we ship, and nothing can re-inject into it afterwards.
 *
 * `expected` comes from the live DOM (document.title etc.) and is the authority
 * on what should survive. If the cleaned head disagrees, we throw — a route that
 * would ship wrong meta fails the build instead of shipping quietly.
 */

const TITLE_RE = /<title\b[^>]*>[\s\S]*?<\/title>/gi;
const CANONICAL_RE = /<link\b[^>]*\brel=["']?canonical["']?[^>]*>/gi;
const META_RE = /<meta\b[^>]*>/gi;

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return m ? m[1] : null;
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * @param {string} html   full serialized document
 * @param {{title: string, canonical: string｜null}} expected  truth from the live DOM
 * @param {string} route  for error messages
 * @returns {{html: string, removed: number}}
 */
export function cleanHead(html, expected, route) {
  const start = html.search(/<head\b[^>]*>/i);
  const end = html.search(/<\/head>/i);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${route}: could not locate <head> in serialized HTML`);
  }
  const before = html.slice(0, start);
  const head = html.slice(start, end);
  const after = html.slice(end);

  let removed = 0;
  let out = head;

  // ── <title> ── keep the first, drop the rest. React emits the route's title
  // first and the shell's fallback after it; document.title (= first element)
  // is what browsers and Google use, so first is also what we verify against.
  {
    const titles = out.match(TITLE_RE) || [];
    if (titles.length > 1) {
      let seen = false;
      out = out.replace(TITLE_RE, (t) => {
        if (!seen) { seen = true; return t; }
        removed++;
        return '';
      });
    }
  }

  // ── <link rel="canonical"> ── drop href-less placeholders, then keep exactly
  // one. Prefer the tag whose href matches the DOM's resolved canonical.
  {
    const canons = out.match(CANONICAL_RE) || [];
    if (canons.length > 0) {
      const populated = canons.filter((c) => (attr(c, 'href') || '').trim() !== '');
      const keep =
        populated.find((c) => decode(attr(c, 'href') || '') === expected.canonical) ||
        populated[populated.length - 1] ||
        null;
      let kept = false;
      out = out.replace(CANONICAL_RE, (c) => {
        if (!kept && c === keep) { kept = true; return c; }
        removed++;
        return '';
      });
    }
  }

  // ── <meta name|property> ── drop empty-content placeholders when a populated
  // tag exists for the same key, then keep the LAST populated one (React's
  // per-route SeoHead emission lands after the shell's static defaults).
  {
    const metas = out.match(META_RE) || [];
    const keyOf = (m) => attr(m, 'property') || attr(m, 'name');
    const populatedLast = new Map();
    const anyKey = new Set();
    for (const m of metas) {
      const k = keyOf(m);
      if (!k) continue;                      // charset / viewport / http-equiv
      anyKey.add(k);
      const c = attr(m, 'content');
      if (c !== null && c.trim() !== '') populatedLast.set(k, m);
    }
    const keepers = new Set(populatedLast.values());
    let idx = 0;
    const occurrence = new Map();
    out = out.replace(META_RE, (m) => {
      const k = keyOf(m);
      idx++;
      if (!k) return m;
      const c = attr(m, 'content');
      const isEmpty = c === null || c.trim() === '';
      // No populated version anywhere for this key: keep the first occurrence.
      if (!populatedLast.has(k)) {
        const n = (occurrence.get(k) || 0) + 1;
        occurrence.set(k, n);
        if (n === 1) return m;
        removed++;
        return '';
      }
      if (isEmpty) { removed++; return ''; }
      if (keepers.has(m)) {
        // `keepers` holds tag STRINGS, so identical duplicates would all match.
        // Retire the entry once kept so only one survives.
        keepers.delete(m);
        return m;
      }
      removed++;
      return '';
    });
  }

  // Tidy the blank lines the removals left behind.
  out = out.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n');

  const cleaned = before + out + after;
  verify(cleaned, expected, route);
  return { html: cleaned, removed };
}

function verify(html, expected, route) {
  const headEnd = html.search(/<\/head>/i);
  const head = html.slice(0, headEnd === -1 ? html.length : headEnd);

  const titles = head.match(TITLE_RE) || [];
  if (titles.length !== 1) {
    throw new Error(`${route}: expected exactly 1 <title> after cleaning, found ${titles.length}`);
  }
  const titleText = decode(titles[0].replace(/<\/?title\b[^>]*>/gi, '')).trim();
  if (expected.title && titleText !== expected.title.trim()) {
    throw new Error(
      `${route}: surviving <title> is "${titleText}" but the rendered page's title is "${expected.title}"`,
    );
  }

  const canons = head.match(CANONICAL_RE) || [];
  if (canons.length > 1) {
    throw new Error(`${route}: ${canons.length} <link rel="canonical"> survived — Google ignores all of them`);
  }
  if (expected.canonical) {
    if (canons.length !== 1) {
      throw new Error(`${route}: page renders canonical ${expected.canonical} but no canonical survived cleaning`);
    }
    const href = decode(attr(canons[0], 'href') || '');
    if (href !== expected.canonical) {
      throw new Error(`${route}: surviving canonical is ${href}, expected ${expected.canonical}`);
    }
  }

  for (const key of ['description', 'robots', 'og:title', 'og:url', 'twitter:card']) {
    const re = new RegExp(`<meta\\b[^>]*\\b(?:name|property)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi');
    const hits = head.match(re) || [];
    if (hits.length > 1) {
      throw new Error(`${route}: ${hits.length} <meta ${key}> tags survived cleaning`);
    }
  }
}
