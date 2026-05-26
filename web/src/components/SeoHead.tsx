/**
 * SeoHead — per-page <title>/<meta>/<link>/<script>.
 *
 * React 19 hoists these tags to <head> automatically when they're rendered
 * inside a component. No react-helmet or react-helmet-async dependency needed.
 *
 * Usage:
 *   <SeoHead
 *     title="PMP Practice — CipherExam"
 *     description="..."
 *     canonical="https://cipherexam.com/lp/pmp"
 *     ogImage="https://cipherexam.com/og-pmp.png"
 *     jsonLd={{ "@context": "https://schema.org", ... }}
 *   />
 *
 * One <SeoHead /> per page. Render it inside the page component's return — the
 * exact position in the JSX doesn't matter; React 19 hoists.
 *
 * Crawler note: this still requires client-side JS execution to populate <head>.
 * For first-pass server-rendered meta, see web/SEO-IMPLEMENTATION.md.
 */
import type { ReactNode } from 'react';

export type SeoHeadProps = {
  title: string;
  description: string;
  canonical: string;
  /** Defaults to og-default.png; pass a per-page card for higher CTR. */
  ogImage?: string;
  /** Override OG type; defaults to 'website'. Use 'article' for blog posts. */
  ogType?: 'website' | 'article';
  /** Optional JSON-LD object or array of objects. Stringified inline. */
  jsonLd?: unknown;
  /** Set to true on pages that should not be indexed (e.g. /success). */
  noindex?: boolean;
  /** Extra <link> / <meta> children if you need anything bespoke. */
  children?: ReactNode;
};

const SITE = 'https://cipherexam.com';
const DEFAULT_OG = `${SITE}/og-default.png`;

export default function SeoHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG,
  ogType = 'website',
  jsonLd,
  noindex = false,
  children,
}: SeoHeadProps) {
  const robots = noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';
  const url = canonical.startsWith('http') ? canonical : `${SITE}${canonical}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={robots} />

      {/* Open Graph — explicit width/height on the image avoid re-scrapes by
          Facebook/LinkedIn and prevent card-layout glitches. All OG cards are
          rendered at 1200×630 (see remotion/src/OGCard.tsx). */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="CipherExam" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />

      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      {children}
    </>
  );
}
