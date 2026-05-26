# SEO MCP Connection Guide

> Owner: Dave · Last updated: 2026-05-26
> Companion to [SEO-IMPLEMENTATION.md](./SEO-IMPLEMENTATION.md) and [GSC-SETUP.md](./GSC-SETUP.md)

This guide walks through connecting an SEO data source to Claude Code via MCP. With an SEO MCP connected, future `/seo-audit` runs use **real ranking + volume data** instead of the keyword-research estimates I had to fall back on.

---

## What "SEO MCP" means

A Model Context Protocol server that exposes SEO tooling as Claude-callable tools. There are three realistic options for cipherexam.com, ordered by ROI:

| Tool | Best for | Cost | Setup difficulty |
|---|---|---|---|
| **Google Search Console MCP** | Your actual ranking data, queries, impressions, CTR | Free | Low — you already have a Google account |
| **DataForSEO MCP** | Volume + difficulty for keywords you don't yet rank for | Pay-per-API-call (~$0.001–$0.05/query) | Medium — needs API key + payment method |
| **Ahrefs MCP** | Backlink intelligence + competitor gap analysis | $99–$449/mo subscription | Medium — needs API token (Ahrefs Standard plan or higher) |

**My recommendation: start with Google Search Console MCP only.** It's free, gives you the data that matters most (what's actually happening on YOUR site), and you can always add DataForSEO later if you want broader keyword research.

---

## Option 1 — Google Search Console MCP (recommended start)

### Prerequisites

- GSC property verified for `cipherexam.com` (see [GSC-SETUP.md](./GSC-SETUP.md))
- A Google Cloud project (free) — you'll create one if you don't have it

### Setup steps

1. **Create a Google Cloud project** at https://console.cloud.google.com
   - Project name: "cipher-seo-mcp" (or whatever)
   - No billing required — Search Console API is free

2. **Enable the Search Console API**
   - In the new project: APIs & Services → Library → search "Search Console API" → click → Enable

3. **Create a service account**
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Name: "claude-seo-reader"
   - Role: leave empty (we'll grant access via GSC, not GCP IAM)
   - After creation, click the service account → Keys → Add Key → JSON
   - Download the JSON key file — keep it safe, it's the auth credential

4. **Grant the service account access to your GSC property**
   - Back in https://search.google.com/search-console
   - Pick the `cipherexam.com` property
   - Settings → Users and permissions → Add user
   - Email = the service account email from the JSON (looks like `claude-seo-reader@cipher-seo-mcp.iam.gserviceaccount.com`)
   - Permission: **Restricted** (read-only is enough)
   - Click Add

5. **Install a GSC MCP server**
   - There are a few community ones — the most maintained is:
     ```
     npm install -g @sondreols/mcp-google-search-console
     ```
   - (Or use the Python equivalent if you prefer pip)

6. **Add it to your Claude Code MCP config**

   On Windows, edit `%APPDATA%\Claude\claude_desktop_config.json` (or wherever your Claude Code config lives). Add to `mcpServers`:
   ```json
   {
     "mcpServers": {
       "gsc": {
         "command": "mcp-google-search-console",
         "env": {
           "GOOGLE_APPLICATION_CREDENTIALS": "C:\\path\\to\\your\\service-account-key.json",
           "GSC_SITE_URL": "https://cipherexam.com/"
         }
       }
     }
   }
   ```

7. **Restart Claude Code.** Run `/mcp` to confirm `gsc` is listed and tools are callable.

### What you'll get

Once connected, future `/seo-audit` runs (or any "check my SEO" question) can pull:
- Top 1000 queries that drove impressions in the last 28 days
- Queries where you rank but don't get clicks (CTR opportunities)
- Pages with falling impressions (sign of de-indexation or competitor wins)
- Mobile vs desktop performance splits
- Per-country breakdown

The keyword table I produced in the first audit was guesswork. With GSC MCP, it would be filled in with real numbers.

---

## Option 2 — DataForSEO MCP (next step if you want broader research)

DataForSEO has competitive volume + difficulty for keywords you DON'T yet rank for. Use this when:
- You want to find keywords competitors rank for but you don't
- You want SERP intent data (what kind of pages currently rank for a query)
- You're considering a new blog post and want to validate demand first

### Setup

1. Sign up at https://app.dataforseo.com/register
2. Add $10 credit (their API is pay-per-call, $0.001–$0.05 per query; $10 lasts a long time for our use)
3. Get your API credentials (Settings → API Access)
4. Install the MCP server:
   ```
   npm install -g @dataforseo/mcp-dataforseo
   ```
5. Add to Claude Code config:
   ```json
   {
     "mcpServers": {
       "dataforseo": {
         "command": "mcp-dataforseo",
         "env": {
           "DATAFORSEO_LOGIN": "your-login",
           "DATAFORSEO_PASSWORD": "your-password"
         }
       }
     }
   }
   ```
6. Restart Claude Code.

**Cost discipline:** each `keywords_for_site` query costs ~$0.05. Don't run it in a loop. A single audit pass typically costs $0.50–$2.

---

## Option 3 — Ahrefs MCP (only if you're already a customer)

If you have an Ahrefs subscription, their MCP exposes backlink intelligence + competitive content gap analysis. The free MCP version is rate-limited to your existing API quota.

- Plans that support the API: Standard ($199/mo) and above
- No setup-cost beyond your existing subscription

Not worth subscribing to Ahrefs just for this. Skip unless you're already using it for something else.

---

## What about Semrush?

Semrush has an MCP in beta but it's still gated behind their Business plan ($449.95/mo). Not worth it for a single-product solo founder.

---

## Verification once connected

After any of the above is wired up, ask Claude:

> "Re-run the SEO audit on cipherexam.com using real data this time"

I'll see the new MCP tools in my tool list, use them to populate the keyword opportunity table with actual numbers, and replace the qualitative competitor comparison with quantitative data.

The previous audit's keyword table used estimates marked clearly as such. With an MCP connected, the next audit will replace those with measured values.

---

## TL;DR — minimum viable next step

1. Finish [GSC-SETUP.md](./GSC-SETUP.md) Step 1–3 (verify property + submit sitemap)
2. Then do Option 1 above (GSC MCP) — it's free and gives you the highest-signal data
3. Re-run the audit once GSC has 7+ days of post-deploy data
4. Add DataForSEO MCP later if you want to chase keyword opportunities you don't yet rank for

Skip Ahrefs and Semrush unless you have specific reasons to spend the money.
