import { type PmiSafeTestimonial, PMI_SAFE_TESTIMONIALS } from "../data/testimonials.pmi-safe";
import { type FullTestimonial, FULL_TESTIMONIALS } from "../data/testimonials.full";

/**
 * Multi-quote testimonial section for landing pages.
 *
 * - `variant="pmi-safe"` — PMP, PgMP, any PMI-credential LP. Pulls from
 *   `PMI_SAFE_TESTIMONIALS`, which by construction contains no contributor
 *   names. Use here.
 * - `variant="full"` — /lp/security-plus, /lp/shrm-cp, any non-PMI surface.
 *   Pulls full attribution.
 *
 * The discriminated union prevents calling `variant="full"` while accidentally
 * rendering PMI-safe data, or vice versa. The data files themselves are
 * separately tree-shaken — importing the wrong file into a PMI LP is the
 * only way to leak a name, and `tests/testimonials-attribution.spec.ts`
 * fails CI if that happens.
 */
type Props = { variant: "pmi-safe" } | { variant: "full" };

export default function TestimonialsSection(props: Props) {
  if (props.variant === "pmi-safe") {
    return <Section items={PMI_SAFE_TESTIMONIALS} renderAttribution={renderPmiSafe} />;
  }
  return <Section items={FULL_TESTIMONIALS} renderAttribution={renderFull} />;
}

function Section<T extends { id: string; quote: string }>({
  items,
  renderAttribution,
}: {
  items: readonly T[];
  renderAttribution: (t: T) => string;
}) {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="mx-auto max-w-5xl px-4 py-12"
    >
      <h2
        id="testimonials-heading"
        className="text-center text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl"
      >
        What credentialed practitioners are saying
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
              {renderAttribution(t)}
            </figcaption>
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderPmiSafe(t: PmiSafeTestimonial): string {
  return `— ${t.institutionalCredential}, ${t.role}`;
}

function renderFull(t: FullTestimonial): string {
  const personal = t.personalCredential ? `, ${t.personalCredential}` : "";
  return `— ${t.fullName}${personal} · ${t.institutionalCredential} · ${t.role}`;
}
