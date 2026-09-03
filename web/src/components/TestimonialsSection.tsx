import { type PmiSafeTestimonial, PMI_SAFE_TESTIMONIALS } from "../data/testimonials.pmi-safe";
import { type FullTestimonial, FULL_TESTIMONIALS } from "../data/testimonials.full";
import { useApprovedTestimonials, type TestimonialDisplayItem } from "../hooks/useApprovedTestimonials";

/**
 * Multi-quote testimonial section for landing pages.
 *
 * - `variant="pmi-safe"` — PMP, PgMP, any PMI-credential LP. Static seed pulls
 *   from `PMI_SAFE_TESTIMONIALS`, which by construction contains no contributor
 *   names.
 * - `variant="full"` — /lp/security-plus, /lp/shrm-cp, any non-PMI surface.
 *   Static seed pulls full attribution.
 *
 * Live-approved testimonials (Firestore `testimonials` where status==='approved')
 * are the PRIMARY source; the static seed above is the fallback shown until at
 * least one testimonial is approved. The live hook maps each variant's data
 * with the same name-safety rule as the static split — the PMI-safe path never
 * reads a name field — so `tests/testimonials-attribution.spec.ts` stays green.
 * The static seed also renders on first paint (live loads async), so the
 * prerendered HTML CI asserts on always carries the safe static data.
 */
type Props = { variant: "pmi-safe" } | { variant: "full" };

export default function TestimonialsSection(props: Props) {
  const live = useApprovedTestimonials(props.variant);

  const staticItems: TestimonialDisplayItem[] =
    props.variant === "pmi-safe"
      ? PMI_SAFE_TESTIMONIALS.map(toPmiSafeDisplay)
      : FULL_TESTIMONIALS.map(toFullDisplay);

  // Live is primary once loaded AND non-empty; otherwise fall back to static.
  const items = live && live.length > 0 ? live : staticItems;

  return <Section items={items} />;
}

function Section({ items }: { items: readonly TestimonialDisplayItem[] }) {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="mx-auto max-w-5xl px-4 py-12"
    >
      <h2
        id="testimonials-heading"
        className="text-center text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl"
      >
        What a credentialed practitioner said
      </h2>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li
            key={t.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <blockquote className="text-base leading-relaxed text-slate-300">
              <span aria-hidden="true" className="text-brand-400 text-xl leading-none">
                &ldquo;
              </span>
              <span className="italic">{t.quote}</span>
              <span aria-hidden="true" className="text-brand-400 text-xl leading-none">
                &rdquo;
              </span>
            </blockquote>
            <figcaption className="mt-5 text-xs font-semibold tracking-wide text-slate-400">
              {t.attribution}
            </figcaption>
          </li>
        ))}
      </ul>
    </section>
  );
}

function toPmiSafeDisplay(t: PmiSafeTestimonial): TestimonialDisplayItem {
  return { id: t.id, quote: t.quote, attribution: `— ${t.institutionalCredential}, ${t.role}` };
}

function toFullDisplay(t: FullTestimonial): TestimonialDisplayItem {
  const personal = t.personalCredential ? `, ${t.personalCredential}` : "";
  return {
    id: t.id,
    quote: t.quote,
    attribution: `— ${t.fullName}${personal} · ${t.institutionalCredential} · ${t.role}`,
  };
}
