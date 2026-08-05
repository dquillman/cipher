import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "../landing/LandingShell";
import PricingCard from "../landing/PricingCard";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";
import GuaranteeSeal from "../../components/GuaranteeSeal";

/**
 * /compare/best-pmp-exam-simulator-2026 — honest buyer's-guide SEO page for
 * candidates evaluating PMP exam simulators ahead of the July 2026 exam change.
 *
 * Format: what to look for in a simulator (criteria first), then how CipherExam
 * meets each criterion. No competitor names, no invented facts — we compare
 * only on CipherExam's own verifiable differentiators. Voice: product voice.
 */
const PAGE_ID = "compare-best-pmp-simulator-2026";
const SIGNUP_HREF = `/login?exam=pmp&utm_lp=${PAGE_ID}`;

export default function BestPmpSimulator2026() {
  return (
    <LandingShell exam="pmp" examShortName="PMP" pageId={PAGE_ID}>
      <SeoHead {...SEO.compareBestPmpSimulator2026} />
      <Hero
        eyebrow="Buyer's Guide · CipherExam"
        h1="Choosing a PMP exam simulator for the 2026 exam"
        sub="PMI updates the PMP exam against a new Exam Content Outline in July 2026. That makes this the worst possible year to pick a simulator on question count alone. Here's a plain checklist of what actually matters — and how CipherExam measures up on each point."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="pmi-safe"
      />

      <SectionBlock>
        <p>
          A simulator has one job: make exam day feel familiar. Not easier —
          familiar. The pacing, the question formats, the fatigue at question 140,
          the way PMI phrases a scenario so that two answers look right. Any tool
          that only checks "did you pick B" is a quiz app, not a simulator. Use the
          five criteria below to evaluate anything you're considering — including us.
        </p>
      </SectionBlock>

      <SectionBlock title="1. Full-length timing that matches the real exam">
        <p>
          The actual PMP is 180 questions in 230 minutes. A simulator that serves
          50-question sets can't train the thing most first-time takers underestimate:
          decision fatigue in hour three. Whatever you buy, confirm it runs a true
          180-question, 230-minute mock.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> our PMP Full Mock is 180 questions
          in 230 minutes — same length, same pacing as the real thing.
        </p>
      </SectionBlock>

      <SectionBlock title="2. Coverage of the new 2026 Exam Content Outline">
        <p>
          This is the big one for 2026. If you sit the exam after the July 2026
          change, prep built against the old outline can leave gaps you won't
          discover until test day. Ask any vendor directly: <em>is your question bank
          updated for the 2026 ECO, or still aligned to the previous outline?</em>{" "}
          If the answer is vague, that's your answer.{" "}
          <Link to="/blog/pmp-exam-changes-july-2026">
            Here's our full breakdown of what changes in July 2026
          </Link>
          , including a bridge plan if you're mid-prep.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> we maintain a dedicated{" "}
          <strong>PMP Exam v2026</strong> question bank as a first-class exam
          alongside the current PMP — same full-mock format, built for the new
          outline. You pick the bank that matches your exam date.
        </p>
      </SectionBlock>

      <SectionBlock title="3. All three question types — not just multiple choice">
        <p>
          The PMP isn't a pure multiple-choice exam. You'll also see calculation
          questions (earned value / EMV math) and matching-style items. If your
          simulator renders everything as four radio buttons, the first time you
          meet the other formats will be on the real exam.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> our PMP banks include all three
          question types — multiple choice, EMV/earned-value calculations (interactive,
          not buried in a text box), and matching.
        </p>
      </SectionBlock>

      <SectionBlock title="4. Explanations that teach reasoning, not just answers">
        <p>
          Simulation without explanation is just expensive score-keeping. The
          questions you get wrong are the whole value of a mock — but only if the
          review teaches you the pattern, so the next scenario phrased differently
          doesn't catch you the same way.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> every question is classified by
          Bloom's taxonomy, so you can see whether you're missing recall questions or
          judgment questions — they need different fixes. And every explanation is
          walked through the Exam Lens: what would PMI want you to do, and why the
          tempting wrong answers are wrong.
        </p>
      </SectionBlock>

      <ExamLensCallout
        prompt="What would PMI want you to do?"
        followUp="Every PMP question is testing this one frame. A good simulator makes it explicit on every explanation — ours does."
      />

      <SectionBlock title="5. A real way to try before you commit">
        <p>
          Prep tools are hard to judge from a features page. The honest test is
          using one: take a set of questions, get some wrong, and read the
          explanations. Prefer vendors that let you do that without a credit card —
          and that stand behind the purchase afterward.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> a 7-day free trial with no credit
          card required, and a 60-day, no-conditions money-back guarantee on Pro. If
          it's not for you, email us within 60 days of your first payment and we
          refund every dollar — no proof of anything, no fine print.
        </p>
      </SectionBlock>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center sm:flex-row sm:text-left">
          <GuaranteeSeal size={140} />
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Evaluate us against this checklist</h2>
            <p className="mt-2 text-slate-300">
              180-question full mocks, a dedicated PMP Exam v2026 bank, all three
              question types, Bloom's-classified reasoning explanations — and if we
              still don't fit how you study, the 60-day guarantee means you're out
              nothing. $19/month, with 10 more certifications included in the same
              subscription.
            </p>
          </div>
        </div>
      </section>

      <SectionBlock>
        <p className="text-center">
          <Link
            to={SIGNUP_HREF}
            onClick={() => trackCtaClick(`${PAGE_ID}-mid-cta`)}
            className="inline-flex items-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Start Free Trial →
          </Link>
        </p>
      </SectionBlock>

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">When exactly does the PMP exam change?</dt>
            <dd className="mt-1">PMI rolls out the updated exam, built against a new Exam Content Outline, in July 2026. If your exam date is after the change, make sure your prep materials are aligned to the new outline. <Link to="/blog/pmp-exam-changes-july-2026" className="text-brand-400 hover:text-brand-300">Full details and a bridge plan here</Link>.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is CipherExam ready for the 2026 exam?</dt>
            <dd className="mt-1">Yes. PMP Exam v2026 is a first-class exam in CipherExam with its own question bank, full 180-question / 230-minute mock, and all three question types (multiple choice, EMV math, matching).</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What if I'm mid-prep and my exam date might slip past July 2026?</dt>
            <dd className="mt-1">Both banks are in the same subscription — practice against the current PMP now and switch to the v2026 bank if your date moves. No add-on purchase.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What does CipherExam cost?</dt>
            <dd className="mt-1">$19/month for Pro — covering PMP plus 10 other certifications — or a one-time $59 Exam Pass for a single exam for 90 days. 7-day free trial, no credit card required, and a 60-day, no-conditions money-back guarantee.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Will using a simulator guarantee I pass?</dt>
            <dd className="mt-1">No tool can promise that, and you should be skeptical of any that does. What a good simulator does is remove the two most common failure modes: unfamiliar pacing and unfamiliar reasoning. The rest is your preparation.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
