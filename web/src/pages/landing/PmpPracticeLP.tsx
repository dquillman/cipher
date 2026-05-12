import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";

/**
 * /lp/pmp-practice — Tier 1 ad landing page for PMP candidates.
 * Copy source: cipher-marketing/04-multi-exam-landing-pages.md (LP #1).
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 */
const PAGE_ID = "lp-pmp-practice";
const SIGNUP_HREF = `/login?exam=pmp&utm_lp=${PAGE_ID}`;

export default function PmpPracticeLP() {
  // Page-level <title>/<meta> normally handled by an SEO helper. Inline for v1.
  if (typeof document !== "undefined") {
    document.title = "PMP Practice with Exam Lens Explanations — CipherExam";
  }

  return (
    <LandingShell exam="pmp" examShortName="PMP" pageId={PAGE_ID}>
      <Hero
        eyebrow="PMP · CipherExam"
        h1="Practice PMP the way PMI thinks."
        sub="Every CipherExam answer is explained through the Exam Lens — what would PMI want you to do? — plus the Bloom's-level reasoning behind the question. Memorizing the PMBOK isn't enough. Reading the question the way the test writers do is."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
      />

      <SectionBlock>
        <p>
          Most PMP candidates plateau around 80% on practice tests and never break through.
          The reason isn't a knowledge gap — it's a frame gap. PMI grades whether you think like
          a PMI-certified PM, not whether you know every ITTO. Practice tools that just drill
          facts can't close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for PMP">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every PMP question is tagged by
            cognitive level. You see whether you're nailing easy "remember" questions but
            missing the "evaluate"-level scenarios that dominate the real exam.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same lens — <em>what would PMI want you to do?</em> — so you
            internalize the frame, not just the facts.
          </li>
          <li>
            <strong>180-question Full Mock with EMV math.</strong> Same length and pacing as
            the actual PMP. EMV / earned-value math is supported natively, not buried in a
            text box.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What would PMI want you to do?"
        followUp="Every PMP question is testing this. We make it explicit on every explanation."
      />

      <TryAQuestion
        examName="PMP"
        domainLabel="Process · Scope / Change Control"
        prompt="A stakeholder demands a scope change on Friday afternoon. Your scrum team's next sprint starts Monday. What do you do first?"
        options={[
          { letter: "A", text: "Tell the stakeholder to submit a formal change request" },
          { letter: "B", text: "Prepare an impact analysis and schedule a stakeholder meeting Monday" },
          { letter: "C", text: "Reject the request — scope was signed off" },
          { letter: "D", text: "Adjust the next sprint backlog" },
        ]}
        correctLetter="B"
        reasoning="The Exam Lens prioritizes understanding the change and bringing stakeholders together as a first move. A is the textbook process answer but PMI-relationally cold. C is brittle and unworkable. D acts before understanding impact."
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
            <dt className="font-semibold text-gray-900">Is this aligned to the current PMP exam (post-2021 update)?</dt>
            <dd className="mt-1">Yes — the question library is built against PMI's current published exam objectives (People / Process / Business Environment).</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Do you cover EMV / earned-value math?</dt>
            <dd className="mt-1">Yes, natively. EMV questions are interactive, not just text — the Full Mock supports the calculations.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">How many questions is the Full Mock?</dt>
            <dd className="mt-1">180 questions in 230 minutes — the same length as the actual PMP exam.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 7-day trial never charges a card. Pro is month-to-month or yearly; cancel from your dashboard.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Do you have CAPM coverage?</dt>
            <dd className="mt-1">Not yet. PMP is fully live. We're adding adjacent PMI certifications based on user demand.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
