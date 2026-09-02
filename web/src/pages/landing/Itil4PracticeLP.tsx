import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/itil — Tier 1 ad landing page for ITIL 4 (PeopleCert) candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 * No testimonials and no lead magnet on this LP (testimonialBadge="none").
 */
const PAGE_ID = "lp-itil-practice";
const SIGNUP_HREF = `/login?exam=itil&utm_lp=${PAGE_ID}`;

export default function Itil4PracticeLP() {
  return (
    <LandingShell exam="itil" examShortName="ITIL 4" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpItil} />
      <Hero
        eyebrow="ITIL 4 · CipherExam"
        h1="Practice ITIL 4 the way the value chain thinks."
        sub="The ITIL 4 exam isn't asking you to recite definitions — it's asking where an activity sits in the service value chain. Every CipherExam answer is explained through the Exam Lens — how does this serve the ITIL service value chain? — plus the Bloom's-level reasoning behind the question. Knowing the terms isn't the same as placing them."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most ITIL 4 candidates can define the guiding principles and name the value chain
          activities — and still miss questions. The reason isn't a vocabulary gap; it's a frame
          gap. The exam grades whether you can trace a real-world activity back to the part of
          the service value chain it serves. Practice tools that just quiz definitions can't
          close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for ITIL 4">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every ITIL 4 question is tagged by
            cognitive level. You see whether you're nailing the easy "remember" definitions but
            missing the "apply"-level scenarios that ask you to place an activity in the value
            chain.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same prompt — <em>how does this serve the ITIL service value chain?</em>{" "}
            — and tied back to the real standard: the six service value chain activities (Plan,
            Engage, Design &amp; Transition, Obtain/Build, Deliver &amp; Support, Improve) and
            the ITIL guiding principles. You internalize the frame, not just the facts.
          </li>
          <li>
            <strong>40-question Full Mock in 60 minutes.</strong> Same length and pacing as the
            real ITIL 4 Foundation exam — all multiple-choice — so timing never surprises you on
            exam day.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="How does this serve the ITIL service value chain?"
        followUp="Every ITIL 4 question is testing this. We make it explicit on every explanation, mapped to the six value chain activities and the guiding principles."
      />

      <TryAQuestion
        examName="ITIL 4"
        domainLabel="Service Value Chain · Activities"
        prompt="A new monitoring tool has just been built and rolled out to the operations team for the first time. Which service value chain activity does this work primarily represent?"
        options={[
          { letter: "A", text: "Improve — the tool will make the service better over time" },
          { letter: "B", text: "Design & transition — the new tool is being moved into live operation" },
          { letter: "C", text: "Deliver & support — the ops team will run the tool day to day" },
          { letter: "D", text: "Engage — stakeholders were consulted about the tool" },
        ]}
        correctLetter="B"
        reasoning="Apply the Exam Lens — how does this serve the service value chain? The activity described is moving a new, built component into live use, which is exactly what Design & transition exists to do: ensure products and services meet expectations and are deployed for ongoing operation. A (Improve) is wrong because nothing is being iterated on yet — it's a first rollout, not a refinement. C (Deliver & support) describes running the tool after it's live, not the act of deploying it. D (Engage) covers understanding stakeholder needs, not deployment. Per the ITIL 4 service value chain, the deployment of a new component is Design & transition."
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
            <dt className="font-semibold text-slate-100">How long is the ITIL 4 Foundation exam?</dt>
            <dd className="mt-1">40 multiple-choice questions in 60 minutes. Our Full Mock matches that exactly — same count, same time limit, all MCQ — so pacing is never a surprise.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes ITIL 4 hard?</dt>
            <dd className="mt-1">It's not the vocabulary — it's the framing. The exam asks you to place a real-world activity in the service value chain (Plan, Engage, Design &amp; Transition, Obtain/Build, Deliver &amp; Support, Improve) and to apply the guiding principles. Knowing the definitions isn't the same as knowing where each activity belongs. That's the gap the Exam Lens targets.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the current ITIL 4 standard?</dt>
            <dd className="mt-1">Yes — the question library is built against the ITIL 4 service value chain activities and the ITIL guiding principles, so you're practicing against the framework the exam actually grades on.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">How are answers explained?</dt>
            <dd className="mt-1">Every right and wrong answer is walked through the Exam Lens — how does this serve the service value chain? — and tied back to the specific value chain activity or guiding principle, plus the Bloom's level of the question. You learn the reasoning pattern, not just the correct letter.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 14-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
