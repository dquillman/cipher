import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

/**
 * A display-ready testimonial item — the common shape both the live Firestore
 * source and the static seed files are mapped into before rendering.
 */
export type TestimonialDisplayItem = {
  id: string;
  quote: string;
  /** Pre-rendered attribution line, e.g. "— Verified CipherExam user · PMP candidate". */
  attribution: string;
};

/**
 * Fetches up to 3 admin-approved testimonials and maps them to display items.
 *
 * Returns `null` until the fetch settles, which is deliberate: the caller
 * renders the static seed on first paint and only swaps in live data once it
 * has loaded AND is non-empty. That ordering keeps the prerendered HTML (and
 * therefore `tests/testimonials-attribution.spec.ts`) showing the static
 * PMI-safe data — live data never appears in the first paint that CI asserts on.
 *
 * Source of truth: the `published_testimonials` collection — the sanitized,
 * public-read (`allow read: if true`), PII-free mirror that Admin-Core's
 * testimonials review page writes on approval. We deliberately do NOT read the
 * raw `testimonials` collection: it holds PII and is admin/owner-read only, so a
 * public landing page can't (and shouldn't) query it. Every doc here is already
 * approved-and-consented — presence in the collection IS the approval gate — so
 * there's no `status`/`consent` filtering to do. Public docs carry only
 * `firstName`, `quote`, `rating`, `examName`, `publishedAt`.
 *
 * PMI-safe hardening: for `variant === "pmi-safe"` the mapper NEVER reads the
 * `firstName` field. Attribution is derived only from the exam, so a published
 * testimonial carrying a first name can never leak it onto a PMI landing page —
 * the same invariant the two separate static data files encode.
 */
export function useApprovedTestimonials(
  variant: "pmi-safe" | "full",
): TestimonialDisplayItem[] | null {
  const [items, setItems] = useState<TestimonialDisplayItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Newest first; single-field orderBy + limit → no composite index required.
        const snap = await getDocs(
          query(
            collection(db, "published_testimonials"),
            orderBy("publishedAt", "desc"),
            limit(3),
          ),
        );

        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
          .filter((r) => typeof r.quote === "string" && (r.quote as string).trim().length > 0)
          .map((r) => mapToDisplayItem(r, variant));

        if (!cancelled) setItems(rows);
      } catch {
        // Offline / no data / missing index → signal "use static fallback".
        if (!cancelled) setItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variant]);

  return items;
}

function mapToDisplayItem(
  r: Record<string, unknown>,
  variant: "pmi-safe" | "full",
): TestimonialDisplayItem {
  const quote = (r.quote as string).trim();
  const examName = typeof r.examName === "string" && r.examName ? r.examName : "certification";

  if (variant === "pmi-safe") {
    // NO name field is read here, by design. See the invariant note above.
    return {
      id: (r.id as string) ?? quote.slice(0, 24),
      quote,
      attribution: `Verified CipherExam user · ${examName} candidate`,
    };
  }

  const name =
    typeof r.firstName === "string" && r.firstName.trim() ? r.firstName.trim() : null;

  return {
    id: (r.id as string) ?? quote.slice(0, 24),
    quote,
    attribution: name
      ? `${name} · ${examName} candidate`
      : `Verified CipherExam user · ${examName} candidate`,
  };
}
