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
 * /lp/pmp — Tier 1 ad landing page for PMP candidates.
 * Copy source: cipher-marketing/04-multi-exam-landing-pages.md (LP #1).
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 */
const PAGE_ID = "lp-pmp-practice";
const SIGNUP_HREF = `/login?exam=pmp&utm_lp=${PAGE_ID}`;

export default function PmpPracticeLP() {
  return (
    <LandingShell exam="pmp" examShortName="PMP" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpPmp} />
      <Hero
        eyebrow="PMP · CipherExam"
        h1="Practice PMP the way PMI thinks."
        sub="Every CipherExam answer is explained through the Exam Lens — what would PMI want you to do? — plus the Bloom's-level reasoning behind the question. Memorizing the PMBOK isn't enough. Reading the question the way the test writers do is."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        videoSrc="/videos/lp/launch-teaser-pmp.mp4"
        testimonialBadge="pmi-safe"
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
            <strong>180-question Full Mock at exam pacing.</strong> The real PMP is 180
            questions (170 scored, 10 pretest) inside a 240-minute sitting. Our Full Mock
            runs the same 180 questions on the same 240-minute clock, so you rehearse
            stamina and pacing at exam scale — not just recall. Items are scenario-driven
            multiple choice; see the earned-value answer below for what we do not cover.
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

      <TestimonialsSection variant="pmi-safe" />

      <LeadMagnetCapture
        cluster="pmp"
        pageId={PAGE_ID}
        headline="Free: The PMP Exam Lens Cheat Sheet"
        sub="5 worked scenarios. The reasoning pattern PMI grades on. Email it to yourself — no trial required."
      />

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the 2026 PMP Exam Content Outline?</dt>
            <dd className="mt-1">
              Yes. PMI's 2026 ECO took effect on 9 July 2026 and is the exam everyone sits now — the
              2021 outline is retired. The domains keep their names (People / Process / Business
              Environment), but the weightings moved to <strong>33% People, 41% Process, 26% Business
              Environment</strong>, and PMI consolidated 35 tasks down to 26. CipherExam ships a
              dedicated <strong>PMP Exam v2026</strong> bank written against that outline, and it's
              what you land on automatically when you start a trial from this page — nothing to
              pick. The retired 2021 bank stays available only if you deliberately switch to it.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you cover EMV / earned-value math?</dt>
            <dd className="mt-1">Not in the current bank, and we would rather say so plainly. The interactive earned-value item type is built, and the ten questions using it sit in our retired 2021-outline bank. <strong>PMP Exam v2026</strong> — the bank you get today — is scenario-driven multiple choice throughout and does not yet include them. If earned-value calculation practice is your priority right now, use the free trial to check before you pay us anything.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">How many questions is the Full Mock?</dt>
            <dd className="mt-1">180 questions in 240 minutes (4 hours) — the same question count and the same clock PMI allots for the live PMP. You run it timed, in one sitting. What we don't reproduce is the rest of the sitting's structure: PMI's two 10-minute breaks and the one-way case-study boundary aren't simulated.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The 14-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you have CAPM coverage?</dt>
            <dd className="mt-1">Not yet. PMP is fully live. We're adding adjacent PMI certifications based on user demand.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
