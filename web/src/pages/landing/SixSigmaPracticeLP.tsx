import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/six-sigma — Tier 1 ad landing page for Six Sigma Green Belt (ASQ CSSGB) candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 * No testimonials / no lead magnet on this LP by design (testimonialBadge="none").
 */
const PAGE_ID = "lp-six-sigma-practice";
const SIGNUP_HREF = `/login?exam=six-sigma&utm_lp=${PAGE_ID}`;

export default function SixSigmaPracticeLP() {
  return (
    <LandingShell exam="six-sigma" examShortName="Six Sigma Green Belt" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpSixSigma} />
      <Hero
        eyebrow="Six Sigma Green Belt · CipherExam"
        h1="Practice Six Sigma by the phase, not just the tool."
        sub="Most candidates know the tools. The exam tests whether you can place each tool in the right DMAIC phase. Every CipherExam answer is explained through the Exam Lens — where in Define-Measure-Analyze-Improve-Control does this fall? — plus the Bloom's-level reasoning behind the question."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most Six Sigma Green Belt candidates can recite the tools — fishbone diagrams, control
          charts, hypothesis tests. They still miss questions, because the exam rarely asks "what
          is this tool?" It asks "which phase are you in, and is this the right move now?" That's
          not a knowledge gap — it's a frame gap. The ASQ Body of Knowledge grades whether you can
          place an action in the DMAIC sequence, and the right tool changes phase by phase.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for Six Sigma">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every Six Sigma question is tagged by
            cognitive level. You see whether you're nailing easy "remember" questions but missing
            the "analyze"-level phase-placement scenarios that decide the real exam.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked through
            the same prompt — <em>where in Define-Measure-Analyze-Improve-Control does this fall?</em>
            — anchored to the DMAIC sequence and the ASQ Certified Six Sigma Green Belt (CSSGB) Body
            of Knowledge, so you internalize the frame, not just the facts.
          </li>
          <li>
            <strong>110-question Full Mock in 258 minutes.</strong> Same length and pacing as the
            actual Green Belt exam, so the clock and the question load feel familiar before exam day.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="Where in Define-Measure-Analyze-Improve-Control does this fall?"
        followUp="Every Six Sigma question is testing this. We make it explicit on every explanation."
      />

      <TryAQuestion
        examName="Six Sigma Green Belt"
        domainLabel="Analyze · Root-Cause Analysis"
        prompt="A project team gathers in a workshop and builds a fishbone (Ishikawa) diagram to surface potential root causes of excess scrap. Which DMAIC phase are they working in?"
        options={[
          { letter: "A", text: "Define — they are scoping the problem and its boundaries" },
          { letter: "B", text: "Measure — they are collecting baseline data on the process" },
          { letter: "C", text: "Analyze — they are identifying potential root causes of the defect" },
          { letter: "D", text: "Improve — they are piloting a solution to reduce scrap" },
        ]}
        correctLetter="C"
        reasoning="Apply the Exam Lens: where in Define-Measure-Analyze-Improve-Control does this fall? A fishbone (Ishikawa) diagram is a root-cause identification tool, and per the DMAIC sequence root-cause analysis is the purpose of the Analyze phase — so C is best. Measure (B) is tempting because the team is in a workshop with data, but Measure is about establishing the baseline, not hypothesizing causes. Define (A) sets scope and the problem statement; Improve (D) tests and pilots solutions only after causes are confirmed. The ASQ Certified Six Sigma Green Belt (CSSGB) Body of Knowledge places cause-and-effect diagrams under Analyze."
        bloomsLevel="Analyze"
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
            <dt className="font-semibold text-slate-100">How long is the Six Sigma Green Belt exam?</dt>
            <dd className="mt-1">Our Full Mock mirrors the ASQ format: 110 multiple-choice questions in 258 minutes. You practice at the same length and pace as the real exam.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the ASQ Body of Knowledge?</dt>
            <dd className="mt-1">Yes — the question library is built against the DMAIC sequence and the ASQ Certified Six Sigma Green Belt (CSSGB) Body of Knowledge, the standard the exam grades against.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes the Green Belt exam hard?</dt>
            <dd className="mt-1">It's not memorizing tools — it's phase placement. The same tool can be wrong in the wrong phase. We explain every answer by naming the DMAIC phase first, so you learn to read questions the way the exam writers do.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What question types are on the exam?</dt>
            <dd className="mt-1">The Green Belt exam is multiple-choice. Our practice and Full Mock match that format, so there are no surprises on exam day.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 7-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
