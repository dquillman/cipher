import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/cia — Tier 1 ad landing page for CIA Part 1 (IIA) candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 *
 * Compliance: testimonialBadge="none" — no TestimonialsSection, no
 * LeadMagnetCapture on this LP. Customer-facing copy uses "Exam Lens"; the
 * internal lens name is never printed in body copy.
 */
const PAGE_ID = "lp-cia-practice";
const SIGNUP_HREF = `/login?exam=cia&utm_lp=${PAGE_ID}`;

export default function CiaPart1PracticeLP() {
  return (
    <LandingShell exam="cia" examShortName="CIA Part 1" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpCia} />
      <Hero
        eyebrow="CIA Part 1 · CipherExam"
        h1="Practice CIA Part 1 the way the IIA Standards grade it."
        sub="Every CipherExam answer is explained through the Exam Lens — what do the IIA International Standards say? — plus the Bloom's-level reasoning behind the question. Memorizing definitions isn't enough. Reading each scenario the way the Standards do is."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most CIA Part 1 candidates know the material and still miss questions. The reason
          usually isn't a knowledge gap — it's a frame gap. Part 1 tests whether you apply the
          IIA International Standards to a scenario, not whether you can recite a definition.
          Two answers will look defensible; only one matches what the Standards actually
          require. Practice tools that just drill facts can't close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for CIA Part 1">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every CIA Part 1 question is tagged by
            cognitive level. You see whether you're nailing easy "remember" questions but
            missing the "apply" and "evaluate" scenarios that decide the real exam.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same lens — <em>what do the IIA International Standards say?</em> — and
            names the specific Standard at work, such as Standard 1210 (Proficiency) or the
            Attribute Standards on independence and objectivity, so you internalize the frame,
            not just the facts.
          </li>
          <li>
            <strong>125-question Full Mock in 150 minutes.</strong> Same length and pacing as the
            actual CIA Part 1, all multiple choice — so exam-day timing feels familiar before it
            counts.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What do the IIA International Standards say?"
        followUp="Every CIA Part 1 question is testing this. We make it explicit on every explanation — and name the exact Standard at work."
      />

      <TryAQuestion
        examName="CIA Part 1"
        domainLabel="Foundations of Internal Auditing · Proficiency & Due Care"
        prompt="The board asks the chief audit executive (CAE) to immediately audit a brand-new, highly technical division the internal audit team has never covered and has no expertise in. What should the CAE do FIRST?"
        options={[
          { letter: "A", text: "Decline the engagement, since the team lacks expertise in the division" },
          { letter: "B", text: "Accept immediately — a board request takes priority over other considerations" },
          { letter: "C", text: "Assess whether the function has the collective competence and resources to perform the engagement before accepting it" },
          { letter: "D", text: "Begin fieldwork right away and bring in outside specialists only if problems surface" },
        ]}
        correctLetter="C"
        reasoning="Applying the Exam Lens — what do the IIA International Standards say? — Standard 1210 (Proficiency) requires that internal auditors possess, or obtain, the knowledge, skills, and competencies needed before performing an engagement. So the CAE's FIRST step is to assess the function's collective competence and resources. A jumps to declining without first assessing or considering external service providers. B ignores Proficiency entirely. D starts work before establishing the competence the Standards require."
        bloomsLevel="Apply"
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
            <dt className="font-semibold text-slate-100">How long is the CIA Part 1 exam?</dt>
            <dd className="mt-1">125 multiple-choice questions in 150 minutes. Our Full Mock matches that length and timing so exam-day pacing feels familiar.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the current IIA Standards?</dt>
            <dd className="mt-1">Yes — the question library is built against the IIA International Standards for the Professional Practice of Internal Auditing, including the Attribute and Performance standards Part 1 grades on.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes CIA Part 1 hard?</dt>
            <dd className="mt-1">The judgment, not the facts. Part 1 leans on the Attribute Standards — independence, objectivity, proficiency, and due professional care. Several answers will look reasonable; the exam rewards the one that matches what the Standards actually require. We explain that ranking on every question.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 14-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you cover CIA Part 2 and Part 3?</dt>
            <dd className="mt-1">Part 1 is fully live. We're adding adjacent IIA parts based on user demand.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
