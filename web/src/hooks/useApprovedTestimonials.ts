import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
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
 * PMI-safe hardening: for `variant === "pmi-safe"` the mapper NEVER reads any
 * name field (`userDisplayName`). Attribution is derived only from the exam,
 * so an approved testimonial carrying a real name can never leak it onto a PMI
 * landing page — the same invariant the two separate static data files encode.
 */
export function useApprovedTestimonials(
  variant: "pmi-safe" | "full",
): TestimonialDisplayItem[] | null {
  const [items, setItems] = useState<TestimonialDisplayItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Single-field equality + limit → no composite index required.
        const snap = await getDocs(
          query(
            collection(db, "testimonials"),
            where("status", "==", "approved"),
            limit(12),
          ),
        );

        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
          // Only surface testimonials the user consented to share.
          .filter((r) => r.consentToShare === true && typeof r.text === "string" && (r.text as string).trim().length > 0)
          .slice(0, 3)
          .map((r) => mapToDisplayItem(r, variant));

        if (!cancelled) setItems(rows);
      } catch {
        // Offline / rules / no data → signal "use static fallback".
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
  const quote = (r.text as string).trim();
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
    r.consentToShare === true && typeof r.userDisplayName === "string" && r.userDisplayName.trim()
      ? r.userDisplayName.trim()
      : null;

  return {
    id: (r.id as string) ?? quote.slice(0, 24),
    quote,
    attribution: name
      ? `${name} · ${examName} candidate`
      : `Verified CipherExam user · ${examName} candidate`,
  };
}
