import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "../landing/LandingShell";
import PricingCard from "../landing/PricingCard";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";
import GuaranteeSeal from "../../components/GuaranteeSeal";

/**
 * /compare/best-pmp-exam-simulator-2026 — honest buyer's-guide SEO page for
 * candidates evaluating PMP exam simulators now that the July 2026 Examination
 * Content Outline is live.
 *
 * Format: what to look for in a simulator (criteria first), then how CipherExam
 * meets each criterion. No competitor names, no invented facts — we compare
 * only on CipherExam's own verifiable differentiators. Voice: product voice.
 *
 * FACT SOURCE: every claim about the real exam on this page comes from PMI's
 * "PMP Examination Content Outline – July 2026": 180 questions (170 scored +
 * 10 pretest) in 240 minutes with two 10-minute breaks; domain weighting
 * People 33% / Process 41% / Business Environment 26%; the item formats named
 * in the outline's question-type section — eight of them, including Pull-down
 * List. Do not restate exam facts here from memory, blog posts, or the old
 * 2021 outline.
 *
 * PRODUCT-CLAIM SOURCE: every claim about CipherExam on this page must be
 * traceable to code, not to config intent.
 *   - Full mock length/clock: config/exams.ts fullMock (180 / 240) consumed by
 *     hooks/useSimulator.ts:62-67. No break logic exists — do not imply breaks.
 *   - Item rendering: components/simulator/QuestionCard.tsx maps
 *     question.options to a single-select list. That is the simulator's only
 *     answer UI. MatchingQuestion and EmvCalculation are rendered by Quiz.tsx
 *     only, never by Simulator.tsx / SimulatorResults.tsx. Do NOT claim the
 *     simulator renders drag-and-drop matching or steps EMV math.
 *   - config/exams.ts questionTypes for 6kECziMtR1BS3MpABLW5 lists eight
 *     formats, but that field has zero consumers repo-wide; it is a roadmap
 *     declaration, not shipped behaviour. Copy follows the code.
 *   - Bloom: bloomLevel is optional (types/Question.ts:41, useSimulator.ts:20)
 *     and SimulatorResults.tsx:381-383 surfaces an untagged count. Never write
 *     "every question is classified by Bloom's taxonomy".
 * This page must stay consistent with /blog/pmp-exam-changes-july-2026, which
 * makes the same disclosure (PmpExamChangesJuly2026.tsx:229-238).
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
        sub="PMI's new Examination Content Outline went live in July 2026, and every PMP sitting is now scored against it. That makes this the worst possible year to pick a simulator on question count alone. Here's a plain checklist of what actually matters — and how CipherExam measures up on each point."
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
          The actual PMP is 180 questions — 170 scored, 10 unscored pretest items
          seeded at random — in 240 minutes, broken by two 10-minute breaks. That's
          a four-hour day. A simulator that serves 50-question sets can't train the
          thing most first-time takers underestimate: decision fatigue in hour three.
          Whatever you buy, confirm it runs a true full-length 180-question mock on
          one clock.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> our PMP full mock is all 180
          questions on a single 240-minute clock — not split across two evenings,
          not pausable when a scenario gets ugly. One limit worth knowing before
          you buy: we run those 240 minutes straight through, without the exam's
          two scheduled 10-minute breaks. You find out what your hour-three
          judgment looks like here, where it's free to be bad.
        </p>
      </SectionBlock>

      <SectionBlock title="2. Built on the 2026 Exam Content Outline, not the retired one">
        <p>
          This is the big one, and it is no longer hypothetical. The July 2026
          outline is what your exam is scored against today, and it reweighted the
          three domains: <strong>People 33%, Process 41%, Business Environment 26%</strong>.
          Business Environment went from the domain everyone skimmed to more than a
          quarter of the exam. Prep still built to the retired outline doesn't just
          feel dated — it under-trains an entire quarter of the test. Ask any vendor
          directly: <em>is your question bank written to the 2026 ECO, or still
          aligned to the previous outline?</em> If the answer is vague, that's your
          answer.{" "}
          <Link to="/blog/pmp-exam-changes-july-2026">
            Here's our full breakdown of what changed in July 2026
          </Link>
          , including a bridge plan if you're mid-prep.
        </p>
        <p>
          <strong>How CipherExam meets it:</strong> <strong>PMP Exam v2026</strong> is a
          first-class exam in CipherExam with its own question bank, written to the new
          outline and weighted 33 / 41 / 26 to match it. It's live now — start a mock
          against it and your question mix matches the exam you'll actually sit.
        </p>
      </SectionBlock>

      <SectionBlock title="3. Question formats — the PMP is not a radio-button exam">
        <p>
          The 2026 outline names a much wider set of item formats than most
          candidates picture. Alongside ordinary single-answer multiple choice,
          it lists <strong>case or scenario</strong> items (new — one detailed
          situation, sometimes with charts, followed by a series of questions),{" "}
          <strong>graphic-based</strong> items (new — read the chart or diagram,
          then answer), <strong>multiple-response</strong> items with more than
          one correct answer, <strong>matching</strong> and{" "}
          <strong>enhanced matching</strong> (drag-and-drop, sometimes onto a
          diagram), <strong>point-and-click</strong> hotspots on an image, and{" "}
          <strong>pull-down lists</strong>. Several of those are computer-based
          testing only. The point isn't to memorize the taxonomy — it's that a
          tool which renders everything as four radio buttons leaves the unfamiliar
          formats for exam day.
        </p>
        <p>
          <strong>How CipherExam meets it — and where it doesn't:</strong> on
          formats, it doesn't yet, and you should hear that here rather than
          discover it after paying. The <strong>PMP Exam v2026</strong> bank ships
          today as scenario-driven single-answer multiple choice, and our
          simulator presents every item that way: one stem, one list of options.
          We do not simulate the linked case-study section, graphic-based items,
          point-and-click hotspots, matching or enhanced matching, or pull-down
          lists — and, as above, we don't reproduce the two-break structure.
          Those formats change how you click, not how you decide, so our work has
          gone into the deciding first. We'll update this page the day that
          changes. If drilling the newer item formats is your single highest
          priority right now, take the free trial and judge for yourself before
          you pay us anything — and either way, spend an hour in PMI's own exam
          tutorial before test day, which is the only place the real interface
          lives.
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
          <strong>How CipherExam meets it:</strong> questions carry a Bloom's-taxonomy
          level, and your mock results break accuracy out by level — so you can see
          whether you're missing recall questions or judgment questions, which need
          different fixes. Coverage isn't total, and we don't paper over it: any
          question not yet tagged is reported to you as untagged rather than quietly
          folded into the numbers. And every explanation is walked through the Exam
          Lens: what would PMI want you to do, and why the tempting wrong answers are
          wrong.
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
              Full-length 180-question mocks on a single 240-minute clock, a PMP
              Exam v2026 bank weighted to the new outline, a Bloom's-taxonomy
              breakdown of every result set, and Exam Lens reasoning on every
              explanation — plus a straight answer above about the formats we
              don't simulate. If we still don't fit how you study, the 60-day
              guarantee means you're out nothing.
              $19/month, with 10 more certifications included in the same
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
            <dt className="font-semibold text-slate-100">Has the PMP exam already changed?</dt>
            <dd className="mt-1">Yes. PMI's updated exam, built against the July 2026 Examination Content Outline, is live — the previous outline is retired, so every PMP sitting now is the new one. It's still 180 questions (170 scored plus 10 unscored pretest items), but the clock changed: you now get 240 minutes, up from the 230 the retired outline allowed, with two 10-minute breaks. The domains are reweighted to People 33% / Process 41% / Business Environment 26%. <Link to="/blog/pmp-exam-changes-july-2026" className="text-brand-400 hover:text-brand-300">Full details and a bridge plan here</Link>.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is CipherExam ready for the 2026 PMP exam?</dt>
            <dd className="mt-1">On content, yes: PMP Exam v2026 is a first-class exam in CipherExam with its own question bank, written to the July 2026 outline and weighted 33 / 41 / 26 to match it, with full-length 180-question mocks on a 240-minute clock and an explanation on every item. On formats, no — not yet: that bank is single-answer multiple choice today, and our simulator presents every item that way. We don't render case-study sets, graphic-based items, point-and-click, matching, or pull-down lists, and we don't reproduce the exam's two 10-minute breaks. If the newer formats are what you're shopping for, use the free trial to check before you buy.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">I started studying before July 2026 — is my prep wasted?</dt>
            <dd className="mt-1">No, but it needs a top-up. The domain names didn't change and most of the underlying judgment carries over; the weighting did change, and Business Environment is now more than a quarter of the exam. Practise against the PMP Exam v2026 bank so your question mix matches the exam you'll sit. It's in the same subscription — no add-on purchase.</dd>
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
