import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";
import TestimonialsSection from "../../components/TestimonialsSection";
import LeadMagnetCapture from "../../components/LeadMagnetCapture";

/**
 * /lp/shrm-cp — Tier 1 ad landing page for SHRM-CP candidates.
 * Copy source: cipher-marketing/04-multi-exam-landing-pages.md (LP #3).
 */
const PAGE_ID = "lp-shrm-cp-practice";
const SIGNUP_HREF = `/login?exam=shrm-cp&utm_lp=${PAGE_ID}`;

export default function ShrmCpPracticeLP() {
  return (
    <LandingShell exam="shrm-cp" examShortName="SHRM-CP" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpShrmCp} />
      <Hero
        eyebrow="SHRM-CP · CipherExam"
        h1="SHRM-CP situational questions, decoded."
        sub='Three of four answer choices will be defensible HR moves. The "right" one aligns with a specific SHRM behavioral competency. CipherExam names the competency on every explanation, so you train the reflex the exam actually grades.'
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        videoSrc="/videos/lp/launch-teaser-shrm.mp4"
      />

      <SectionBlock>
        <p>
          Most senior HR pros fail SHRM-CP not because they lack knowledge — but because
          they've spent years making pragmatic HR calls. The exam grades you against an
          idealized competency frame, and pragmatic answers score lower than the answer that
          visibly enacts a named SHRM competency. Knowing the nine competencies isn't enough.
          Naming which one is being tested <em>before</em> you pick is the skill.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for SHRM-CP">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> SHRM-CP is heavy on
            <em> evaluate</em>-level situational judgment. Our classification tells you
            whether you're missing easy items or the high-cognitive items that dominate the
            scored questions.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer names which
            of the nine behavioral competencies (Leadership, Ethical Practice, Business Acumen,
            Relationship Management, Consultation, Critical Evaluation, Global Mindset, Cultural
            Effectiveness, Communication) is being tested.
          </li>
          <li>
            <strong>134-question Full Mock at real exam pacing.</strong> 134 questions in 220
            minutes — the same length and pacing as the actual SHRM-CP exam. Time pressure is
            where pragmatic-vs-competency reflexes break; we train both.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What aligns with SHRM behavioral competencies?"
        followUp="Name the competency. The answer follows."
      />

      <TryAQuestion
        examName="SHRM-CP"
        domainLabel="Behavioral Competency · Consultation"
        prompt={`A high-performing manager is consistently late submitting performance reviews. Her director defends her — "she's a top producer, leave her alone." What does HR do?`}
        options={[
          { letter: "A", text: "Defer to the director and let it go" },
          { letter: "B", text: "Escalate to the CHRO" },
          { letter: "C", text: "Coach the director on why timely performance management matters to the org" },
          { letter: "D", text: "Document the pattern and address the manager directly" },
        ]}
        correctLetter="C"
        reasoning="The competency being tested is Consultation — HR's role is to advise leaders to make better people decisions, not to capitulate (A) or police (D). C demonstrates Consultation most directly."
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

      <TestimonialsSection variant="full" />

      <LeadMagnetCapture
        cluster="shrm-cp"
        pageId={PAGE_ID}
        headline="Free: The SHRM-CP Behavioral Competency Map"
        sub="Name the competency. Pick the answer. 6 worked scenarios with the reasoning SHRM grades on. Email it to yourself, no trial required."
      />

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the current SHRM-CP exam?</dt>
            <dd className="mt-1">Yes — built against SHRM's Body of Applied Skills and Knowledge (BASK) and the nine behavioral competencies.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you cover situational-judgment questions specifically?</dt>
            <dd className="mt-1">Yes — they're the dominant format and every one is tagged with the competency being tested.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">How many questions is the Full Mock?</dt>
            <dd className="mt-1">134 questions in 220 minutes — the same as the actual exam.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you also have SHRM-SCP?</dt>
            <dd className="mt-1">Not yet. SHRM-CP is fully live; SHRM-SCP is on the roadmap based on user demand.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Cancel anytime?</dt>
            <dd className="mt-1">Yes. 14-day trial never charges a card.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
