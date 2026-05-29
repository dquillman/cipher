/**
 * Testimonials for PMI-product landing pages (PMP, PgMP, and any future
 * PMI-credential LP).
 *
 * HARD RULE — this file MUST NOT contain any contributor's personal name or
 * personal credential (e.g. "PgMP"). Use neutral IDs and the institutional
 * credential only. Source of truth: `cipher-exam-context` skill, 2026-05-28.
 *
 * Violations are caught by `tests/testimonials-attribution.spec.ts`, which
 * fails CI if any banned strings appear in the rendered PMI LP HTML.
 *
 * Why a separate file from `testimonials.full.ts`: tree-shaking guarantees
 * the PMI LP route bundle never contains a contributor's name string at all
 * — not in DOM text, not in the JS bundle, not in `view-source:`. Importing
 * from `testimonials.full` inside a PMI LP component is a defect.
 */

export type PmiSafeTestimonial = {
  /** Neutral identifier — must not encode a person's name. */
  readonly id: string;
  /** Verbatim quote. Single source of truth for the same quote in `testimonials.full.ts`. */
  readonly quote: string;
  /** Institutional credential (e.g. "PMI AI Standards Core Team Member"). */
  readonly institutionalCredential: string;
  /** Generic role (e.g. "CipherExam beta tester"). */
  readonly role: string;
};

export const PMI_SAFE_TESTIMONIALS: readonly PmiSafeTestimonial[] = [
  {
    id: "tester-pmi-01",
    quote:
      "What you have built is differentiated by the coaching lens approach, the exam-specific reasoning frameworks, and the feedback loop you ran with real testers.",
    institutionalCredential: "PMI AI Standards Core Team Member",
    role: "CipherExam beta tester",
  },
  // Slots for 2 more PMP testimonials — collect from non-conflicting beta testers
  // (i.e. testers who do NOT operate prep products in adjacent PMI space).
];
