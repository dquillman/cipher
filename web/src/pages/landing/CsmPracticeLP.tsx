import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/csm — Tier 1 ad landing page for Certified ScrumMaster (CSM) candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 * testimonialBadge="none" — no testimonials / no lead magnet on this LP (mandatory).
 */
const PAGE_ID = "lp-csm-practice";
const SIGNUP_HREF = `/login?exam=csm&utm_lp=${PAGE_ID}`;

export default function CsmPracticeLP() {
  return (
    <LandingShell exam="csm" examShortName="CSM" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpCsm} />
      <Hero
        eyebrow="CSM · CipherExam"
        h1="Practice CSM the way the Scrum Guide thinks."
        sub="The CSM exam isn't about how your team does agile. It's about what the Scrum Guide says the role should do. Every CipherExam answer is explained through the Exam Lens — what does the Scrum Guide say the role should do? — plus the Bloom's-level reasoning behind the question. Knowing the events and artifacts isn't enough. Reading each scenario the way the Guide does is."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most CSM candidates know the three accountabilities, the five events, and the three
          artifacts cold. They still miss scenario questions. The reason isn't a knowledge gap —
          it's a frame gap. The exam grades whether you can apply the Scrum Guide to a messy,
          real-world situation, not whether you can recite it. Practice tools that just drill
          definitions can't close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for CSM">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every CSM question is tagged by
            cognitive level. You see whether you're nailing the easy "remember" questions but
            missing the "apply" and "analyze" scenarios where a stakeholder, a Sprint Goal, and
            an ambiguous role all collide.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same lens — <em>what does the Scrum Guide say the role should do?</em> —
            grounded in the current Scrum Guide: the three accountabilities (Scrum Master,
            Product Owner, Developers), the Sprint Goal, and the events and artifacts. You
            internalize the frame, not just the facts.
          </li>
          <li>
            <strong>50-question Full Mock in 60 minutes.</strong> Same length and pacing as the
            CSM exam — 50 multiple-choice questions, 60 minutes. You practice the clock, not just
            the content.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What does the Scrum Guide say the role should do?"
        followUp="Every CSM scenario is testing this. We make it explicit on every explanation — which accountability owns the decision, and what the Guide says about it."
      />

      <TryAQuestion
        examName="CSM"
        domainLabel="Scrum Theory · Accountabilities & the Sprint Goal"
        prompt="Midway through a Sprint, a stakeholder pushes the team to add a new high-priority feature. Who decides whether it gets into the current Sprint?"
        options={[
          { letter: "A", text: "The Scrum Master decides, since they protect the team from interruptions" },
          { letter: "B", text: "The Developers decide, since they own how much work fits in the Sprint" },
          { letter: "C", text: "The Product Owner decides — and only if the change does not threaten the Sprint Goal" },
          { letter: "D", text: "Escalate to management to rule on the change request" },
        ]}
        correctLetter="C"
        reasoning="Apply the Exam Lens: what does the Scrum Guide say the role should do? The Product Owner is accountable for the Product Backlog and its ordering, so any decision about adding scope runs through them. But the Guide also protects the Sprint Goal — the Sprint Goal stays fixed during the Sprint, and scope can be renegotiated with the Product Owner as long as it does not endanger that goal. A is wrong: the Scrum Master facilitates and protects focus but does not own backlog decisions. B is wrong: Developers decide how much they can take on, not what the priorities are. D is wrong: Scrum is self-managing — there is no external authority that overrides the Product Owner on backlog scope."
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
            <dt className="font-semibold text-slate-100">How long is the CSM exam, and what format is it?</dt>
            <dd className="mt-1">The CSM exam is 50 multiple-choice questions with a 60-minute limit. Our Full Mock matches that length and timing exactly, so you practice the pacing as well as the content.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the current Scrum Guide?</dt>
            <dd className="mt-1">Yes. Every explanation is grounded in the current edition of the Scrum Guide — the three accountabilities (Scrum Master, Product Owner, Developers), the Sprint Goal, and the events and artifacts. We cite what the Guide actually says, not generic agile opinion.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes the CSM exam hard?</dt>
            <dd className="mt-1">Recall isn't the trap — judgment is. Most candidates know the framework but stumble on scenarios where several answers look reasonable. The exam tests which Scrum role owns the decision and what the Guide says they should do. That's exactly what the Exam Lens trains.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 7-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you cover other Scrum Alliance certifications?</dt>
            <dd className="mt-1">CSM is fully live. We're adding adjacent Scrum and agile certifications based on user demand.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
