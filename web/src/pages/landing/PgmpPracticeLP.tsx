import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/pgmp — Tier 1 ad landing page for PgMP candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 *
 * PMI-safe surface: testimonialBadge="none" and NO testimonials / lead magnet
 * anywhere on this page (per PMI compliance rule). Do not import
 * TestimonialsSection or LeadMagnetCapture here.
 *
 * NOTE: This page requires two upstream dependency edits before it compiles:
 *   1. web/src/pages/landing/LandingShell.tsx — add "pgmp" to the
 *      LandingShellProps.exam union (currently excludes it).
 *   2. web/src/config/seo.ts — add the `lpPgmp` SEO entry.
 */
const PAGE_ID = "lp-pgmp-practice";
const SIGNUP_HREF = `/login?exam=pgmp&utm_lp=${PAGE_ID}`;

export default function PgmpPracticeLP() {
  return (
    <LandingShell exam="pgmp" examShortName="PgMP" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpPgmp} />
      <Hero
        eyebrow="PgMP · CipherExam"
        h1="Practice PgMP at the program level, not the project level."
        sub="The PgMP isn't a bigger PMP. It grades whether you think like a program manager — does this action serve the program's strategic objectives and benefits realization? Every CipherExam answer is explained through that Exam Lens, plus the Bloom's-level reasoning behind the question."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most PgMP candidates already passed the PMP — and that's exactly where they get tripped
          up. The PgMP isn't a knowledge gap, it's a frame gap. The exam keeps asking you to choose
          between an answer that's tactically efficient and an answer that protects benefits
          realization. They look equally defensible. The program-level frame is what tells them
          apart, and drilling facts can't teach it.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for PgMP">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every PgMP question is tagged by
            cognitive level. You see whether you're nailing the easy "remember" items but missing
            the "evaluate"-level governance scenarios that dominate the real exam.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked through
            the same lens — <em>how does this serve the program's strategic objectives and benefits
            realization?</em> — anchored to PMI's Standard for Program Management and the program
            governance domain, so you internalize the frame, not just the facts.
          </li>
          <li>
            <strong>170-question Full Mock.</strong> Same length and pacing as the actual PgMP —
            170 multiple-choice questions in 240 minutes — so exam-day stamina is part of the
            practice, not a surprise.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="How does this serve the program's strategic objectives and benefits realization?"
        followUp="Every PgMP question is testing this. We make it explicit on every explanation, anchored to the Standard for Program Management."
      />

      <TryAQuestion
        examName="PgMP"
        domainLabel="Program Governance · Benefits Realization"
        prompt="A component project inside your program is on budget and on schedule, but a strategy shift means its deliverable no longer maps to any program benefit. What should the program manager do?"
        options={[
          { letter: "A", text: "Let the project finish — it's on budget and on schedule, and cancelling wastes the sunk cost" },
          { letter: "B", text: "Recommend the project be cancelled or closed and redeploy its resources toward benefit-aligned work" },
          { letter: "C", text: "Keep the project running but quietly reduce its funding to free up budget" },
          { letter: "D", text: "Escalate to the project's sponsor and let them decide whether to continue" },
        ]}
        correctLetter="B"
        reasoning="Through the Exam Lens — how does this serve the program's strategic objectives and benefits realization? — a component that no longer maps to a benefit no longer earns its place, no matter how well it's executing. Program governance under the Standard for Program Management prioritizes benefits realization over tactical metrics and sunk cost, so the program manager recommends closing it and redeploying resources. A and C protect sunk cost and on-time/on-budget vanity metrics — the project-level trap the PgMP is built to expose. D abdicates the program manager's governance responsibility to a project-level sponsor."
        bloomsLevel="Evaluate"
      />

      <SectionBlock>
        <p className="text-center">
          <Link
            to={SIGNUP_HREF}
            onClick={() => trackCtaClick(`${PAGE_ID}-try-q-cta`)}
            className="inline-flex items-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Start Free Trial to see more questions like this →
          </Link>
        </p>
      </SectionBlock>

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">How long is the PgMP exam, and what's the format?</dt>
            <dd className="mt-1">170 multiple-choice questions in 240 minutes. Our Full Mock matches that length and pacing so you train your stamina, not just your recall.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes the PgMP harder than the PMP?</dt>
            <dd className="mt-1">It moves up a level. Where the PMP tests project-level judgment, the PgMP tests program governance — whether an action serves the program's strategic objectives and benefits realization, not whether it's tactically efficient. Our explanations are built around that frame.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What standard are the questions aligned to?</dt>
            <dd className="mt-1">PMI's Standard for Program Management, with emphasis on program governance and benefits realization — the areas where most candidates' PMP instincts lead them to the wrong answer.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you explain why the wrong answers are wrong?</dt>
            <dd className="mt-1">Yes. Every option gets walked through the same lens — including why the tactically tempting answer was crafted to bait a project-level mindset.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 7-day trial never charges a card. Pro is month-to-month or yearly; cancel from your dashboard.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
