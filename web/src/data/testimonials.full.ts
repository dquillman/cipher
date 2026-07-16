/**
 * Testimonials for non-PMI surfaces — cipherexam.com homepage, /lp/security-plus,
 * /lp/shrm-cp, credibility pages, LinkedIn founder posts.
 *
 * Full attribution allowed: contributor name + personal credential +
 * institutional credential + role.
 *
 * DO NOT import this file from any PMI-product LP component (PMP, PgMP, any
 * future PMI-credential LP). Tree-shaking ensures PMI LP bundles don't
 * include these strings; importing it would defeat that guarantee.
 *
 * Source of truth: `cipher-exam-context` skill, 2026-05-28.
 */

export type FullTestimonial = {
  readonly id: string;
  readonly quote: string;
  readonly fullName: string;
  readonly personalCredential?: string;
  readonly institutionalCredential: string;
  readonly role: string;
};

export const FULL_TESTIMONIALS: readonly FullTestimonial[] = [
  {
    id: "tester-001",
    quote:
      "What you have built is differentiated by the coaching lens approach, the exam-specific reasoning frameworks, and the feedback loop you ran with real testers.",
    fullName: "Markus Kopko",
    personalCredential: "PgMP",
    institutionalCredential: "PMI AI Standards Core Team Member",
    // Scoped 2026-07-16: Markus has since launched a competing PgMP prep tool.
    // Disclosing that is both honest and stronger — a competitor praising the
    // product. Quote stays until 3+ student testimonials replace the marquee.
    role: "CipherExam beta tester — now builds a competing PgMP prep tool",
  },
];
