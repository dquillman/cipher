import { Fragment } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SectionBlock } from "./LandingShell";

/**
 * LpFaq — the "Frequently asked" block on every /lp/* page, plus the FAQPage
 * JSON-LD that describes it.
 *
 * One array per LP feeds BOTH the visible <dl> and the schema, so the two can
 * never drift. Google treats a schema/visible-content mismatch as spam, which
 * is why the answers are authored once here and never hand-copied into seo.ts.
 *
 * Answer strings accept three inline marks and nothing else:
 *   **bold**            → <strong>
 *   _italic_            → <em>
 *   [text](/path)       → <Link to="/path">   (internal routes only)
 *
 * The schema text strips all three to plain prose, which is what Google's
 * rich-result validator expects in acceptedAnswer.text.
 *
 * Usage (see PmpPracticeLP.tsx):
 *   const FAQS: LpFaq[] = [{ q: "…", a: "…" }];
 *   <SeoHead {...SEO.lpPmp} jsonLd={faqJsonLd(FAQS)} />
 *   …
 *   <LpFaqSection faqs={FAQS} />
 */
export type LpFaq = { q: string; a: string };

// ---- inline mark parsing --------------------------------------------------

// Italic marks must sit at word boundaries so identifiers like snake_case_word
// or SY0_701 are never eaten. Bold and link marks are unambiguous.
const MARK_RE = /(\*\*[^*]+\*\*|(?<![A-Za-z0-9])_[^_]+_(?![A-Za-z0-9])|\[[^\]]+\]\(\/[^)\s]*\))/g;

function renderInline(text: string): ReactNode {
  const parts = text.split(MARK_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (link) {
      return (
        <Link key={i} to={link[2]} className="text-brand-400 underline underline-offset-2 hover:text-brand-300">
          {link[1]}
        </Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Plain-prose form of an answer for structured data. */
export function stripMarks(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![A-Za-z0-9])_([^_]+)_(?![A-Za-z0-9])/g, "$1")
    .replace(/\[([^\]]+)\]\(\/[^)\s]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- schema ---------------------------------------------------------------

/**
 * FAQPage JSON-LD for the given questions. Pass the result to SeoHead's jsonLd
 * prop. Returns a single object (not an array) because each LP emits exactly
 * one FAQPage; the sitewide Organization/WebSite block lives in index.html.
 */
export function faqJsonLd(faqs: LpFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: stripMarks(q),
      acceptedAnswer: { "@type": "Answer", text: stripMarks(a) },
    })),
  };
}

// ---- visible block --------------------------------------------------------

export function LpFaqSection({ faqs, title = "Frequently asked" }: { faqs: LpFaq[]; title?: string }) {
  return (
    <SectionBlock title={title}>
      <dl className="space-y-6">
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-semibold text-slate-100">{renderInline(q)}</dt>
            <dd className="mt-1">{renderInline(a)}</dd>
          </div>
        ))}
      </dl>
    </SectionBlock>
  );
}
