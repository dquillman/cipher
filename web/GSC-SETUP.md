# Google Search Console Setup — CipherExam

> Owner: Dave · Last updated: 2026-05-26
> Companion to [SEO-IMPLEMENTATION.md](./SEO-IMPLEMENTATION.md)

This guide gets Google Search Console (GSC) verified for cipherexam.com and re-submits the sitemap after the prerender + meta overhaul. **You need to do steps 1, 2, 3 manually — they require your Google account.** Steps 4+ I've already staged.

---

## Why bother

Without GSC verified you're flying blind:
- No visibility into which queries cipherexam.com appears for
- No alerts when pages drop out of the index
- No way to request re-indexing after the SEO overhaul
- No coverage report to confirm Googlebot is actually crawling the prerendered HTML

After verification you get all of the above plus the ability to manually request indexing for high-priority URLs (e.g. the new `/exam-lens` glossary).

---

## Step 1 — Add the property

1. Go to https://search.google.com/search-console
2. Sign in with the Google account that owns cipherexam.com (Dave's primary)
3. Click **Add property** → choose **URL prefix** (not Domain — the URL-prefix property is faster to verify and sufficient for our needs)
4. Enter: `https://cipherexam.com/`
5. Click **Continue**

You'll land on a verification page with 4–5 options. Use one of these two:

---

## Step 2 — Verify (pick the easier path)

### Option A — HTML file upload (recommended, fastest)

1. On the GSC verification page, click **HTML file**.
2. Google generates a file named like `googleabc123def456.html`. Download it.
3. **Tell me the filename** (or just paste the file contents to me) and I'll:
   - Drop the file into `web/public/` (Vite copies `public/*` straight to `dist/` at build time)
   - Add it to the prerender allowlist so it doesn't get clobbered
   - Confirm it's served at `https://cipherexam.com/googleabc123def456.html`
4. Back in GSC, click **Verify**.

### Option B — DNS TXT record (works for any subdomain too)

1. On the GSC verification page, click **Domain name provider** (if you went with URL-prefix, it'll be **HTML tag** — switch to **Add property** → **Domain** for this option, OR stick with URL-prefix and use HTML tag below).
2. Google gives you a TXT record like `google-site-verification=abc123...`
3. Add it via your DNS host (whoever runs cipherexam.com's nameservers — likely Cloudflare or Namecheap based on the domain).
4. Wait 5–30 minutes for propagation. Verify with:
   ```bash
   nslookup -type=TXT cipherexam.com
   ```
5. Back in GSC, click **Verify**.

### Option C — HTML tag (works if you don't want to deploy a file)

1. On the GSC verification page, click **HTML tag**.
2. Google gives you a `<meta name="google-site-verification" content="..." />` snippet.
3. **Paste it to me** and I'll add it to `web/index.html` in the `<head>` (above the `<title>`).
4. Re-deploy with `npm run build && firebase deploy --only hosting:production`.
5. Back in GSC, click **Verify**.

---

## Step 3 — Submit the sitemap

After verification succeeds:

1. In GSC left nav, click **Sitemaps**.
2. Under "Add a new sitemap", enter: `sitemap.xml`
3. Click **Submit**. GSC will fetch `https://cipherexam.com/sitemap.xml` and parse it.
4. You should see "Success" with "19 discovered URLs". If you see "Couldn't fetch", the sitemap isn't deployed yet — push a build first.

The sitemap is regenerated on every `npm run build` (via `web/scripts/generate-sitemap.mjs`). Routes added to App.tsx must also be added to that script's route list.

---

## Step 4 — Already done (no action needed)

I've already:

- ✅ Shipped a real `/robots.txt` referencing the sitemap
- ✅ Shipped a real `/sitemap.xml` with all 19 public routes (priorities + changefreqs set)
- ✅ Made every route serve real HTML to first-pass crawlers (prerender pipeline)
- ✅ Set per-route titles, descriptions, canonicals
- ✅ Added Article/FAQPage/Product/DefinedTermSet/BreadcrumbList JSON-LD schema
- ✅ Configured OG/Twitter cards with proper dimensions
- ✅ Set `noindex` on `/404` (any URL that doesn't exist) so unknown URLs don't pollute the index
- ✅ Generated the OG card image library (`og-default.png`, `og-pmp.png`, `og-security-plus.png`, `og-shrm-cp.png`, `og-story.png`)

---

## Step 5 — After verification: what to do in GSC

The week you verify, do these in GSC:

1. **URL Inspection** on the homepage and each Tier 1 LP (`/lp/pmp`, `/lp/security-plus`, `/lp/shrm-cp`). Click "Request Indexing" on each — bumps them in the crawl queue.
2. **Coverage report** (under Indexing → Pages): check there are no excluded URLs that should be indexed. Watch for "Discovered but not indexed" and "Crawled but not indexed".
3. **Enhancement reports** (FAQ, Breadcrumb, Article): each is a separate panel under Enhancements. They'll populate within a few days of the first crawl, showing which pages qualify for which rich result.
4. **Performance report**: track impressions + clicks per query. Bookmark filters for:
   - Query contains "pmp"
   - Query contains "security+" OR "comptia"
   - Query contains "shrm"
   - Query contains "exam lens"  ← validates the proprietary term claim

---

## Step 6 — Ongoing maintenance

- Re-submit sitemap whenever you add a new public route (just re-deploy; the build regenerates sitemap.xml). GSC re-checks weekly anyway.
- Use **URL Inspection → Request Indexing** for any newly added blog post or LP — gets a hand-priority bump (limited to ~10/day per property).
- Watch the **Performance report** for queries where you rank #4–10 but get no clicks. Those are CTR opportunities — usually fixable by tightening the meta description.
- If Coverage shows pages "Crawled but not indexed", that means Google saw them but didn't think they were worth ranking. Usually a thin-content signal — beef up the page or remove it.

---

## When you've finished Step 2

Tell me which option you used and what filename/tag/TXT value Google gave you. I'll wire it in, build locally, and confirm it's served. Then you click Verify in GSC.
