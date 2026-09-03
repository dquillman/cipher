import { Link } from "react-router-dom";
import { SUPPORT_EMAIL } from '../../config/support';
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "../landing/LandingShell";
import PricingCard from "../landing/PricingCard";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";
import GuaranteeSeal from "../../components/GuaranteeSeal";

/**
 * /compare/pocketprep-alternative — high-intent SEO comparison page for
 * candidates searching for a Pocket Prep alternative.
 *
 * Competitor claims are grounded in cipher-marketing/site/data/competitors.json
 * (pocket-prep entry). Where competitor data is missing we compare only on
 * CipherExam's own verifiable differentiators — no invented facts, no
 * disparagement. Voice: product voice ("we"), respectful and factual.
 */
const PAGE_ID = "compare-pocketprep-alternative";
const SIGNUP_HREF = `/login?exam=pmp&utm_lp=${PAGE_ID}`;

export default function PocketPrepAlternative() {
  return (
    <LandingShell exam="pmp" examShortName="your exam" pageId={PAGE_ID}>
      <SeoHead {...SEO.comparePocketPrep} />
      <Hero
        eyebrow="Comparison · CipherExam"
        h1="Looking for a Pocket Prep alternative?"
        sub="Pocket Prep is a solid, mobile-first question bank covering PMP, Security+, and many other certifications. If you've drilled hundreds of questions and still feel like the exam is a coin flip, the missing piece usually isn't more questions — it's the reasoning behind them. That's what we built CipherExam around."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="pmi-safe"
      />

      <SectionBlock title="Credit where it's due">
        <p>
          Pocket Prep earned its reputation: a large question bank, a polished mobile
          experience, and coverage across many certifications. Plenty of people have
          used it and passed. This page isn't here to tell you it's bad — it's here
          to explain what we do differently, so you can decide which approach fits
          how you learn.
        </p>
      </SectionBlock>

      <SectionBlock title="What CipherExam does differently">
        <ol className="space-y-4">
          <li>
            <strong>Every question is classified by Bloom's taxonomy.</strong> All four banks, all 567 questions. Volume
            drilling treats all questions the same. We tag each one by cognitive
            level, so you can see where your accuracy drops as the reasoning gets harder.
            Each bank is weighted the way its own exam is, so the spread of levels differs
            between them.
          </li>
          <li>
            <strong>Exam Lens explanations teach the reasoning.</strong> Every right
            and wrong answer is walked through the exam's own reasoning framework —
            the mindset the test writers grade against — not just a restated fact.
            You learn how the exam thinks, not just what the answer was.
          </li>
          <li>
            <strong>Four certifications, covered in depth.</strong> PMP,
            CompTIA Security+, Network+ and A+ Core 2 — one account, one price,
            no per-exam add-ons. We used to list eleven and cut back to four on
            purpose: a bank that cannot fill more than one full-length mock is
            not worth selling. Pocket Prep's catalogue is far wider than ours,
            and if you need a certification outside those four, theirs is the
            better answer.
          </li>
          <li>
            <strong>Built for the PMP exam that's live today.</strong> PMI's new
            Exam Content Outline took effect on 9 July 2026 — the domains still read
            People / Process / Business Environment, but the weightings moved to
            33% / 41% / 26% and 35 tasks were consolidated into 26. We ship a
            dedicated PMP Exam v2026 bank written against that outline, so your
            practice mix matches the exam you'll actually sit.{" "}
            <Link to="/blog/pmp-exam-changes-july-2026">Here's what changed</Link>.
          </li>
          <li>
            <strong>A 60-day, no-conditions money-back guarantee.</strong> Use
            CipherExam Pro for up to 60 days. Not for you? Email us and we refund
            every dollar — no proof of anything, no fine print.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What would the exam want you to do?"
        followUp="Every explanation on CipherExam answers this question explicitly. That's the difference between drilling answers and learning the frame."
      />

      <SectionBlock title="How to decide">
        <p>
          A fair way to compare any two prep tools: take ten practice questions in
          each, get a few wrong on purpose, and read the explanations. Ask yourself
          one thing — <em>did this explanation teach me how to get the next question
          right, or just this one?</em>
        </p>
        <p>
          If flashcard-style volume is working for you, keep going — momentum
          matters. If you've plateaued, try the reasoning-first approach. The 14-day
          free trial doesn't ask for a credit card, so testing us costs nothing but
          an evening.
        </p>
      </SectionBlock>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center sm:flex-row sm:text-left">
          <GuaranteeSeal size={140} />
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Switching is risk-free</h2>
            <p className="mt-2 text-slate-300">
              Start with the 14-day free trial — no credit card required. If you go
              Pro, you're covered by a 60-day, no-conditions money-back guarantee.
              Email <span className="text-brand-300">{SUPPORT_EMAIL}</span> within
              60 days of your first payment and we refund everything you've paid.
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
            <dt className="font-semibold text-slate-100">Is CipherExam a Pocket Prep replacement or a supplement?</dt>
            <dd className="mt-1">Either. Some people run both — volume drilling in one, reasoning practice in the other. Most find that once explanations start teaching the frame, they consolidate to one tool.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Which certifications does CipherExam cover?</dt>
            <dd className="mt-1">Four: PMP (a dedicated PMP Exam v2026 bank built to PMI's July 2026 Exam Content Outline), CompTIA Security+ (SY0-701), CompTIA Network+ (N10-009), and CompTIA A+ Core 2 (220-1202) — all in one subscription. If you need a certification outside those four, Pocket Prep's catalogue is much wider than ours and we would point you there.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What does it cost?</dt>
            <dd className="mt-1">$19/month for Pro, or a one-time $59 Exam Pass that covers one exam for 90 days and never renews. Every plan starts with a 14-day free trial — no credit card required — and Pro is covered by a 60-day, no-conditions money-back guarantee.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Can I cancel anytime?</dt>
            <dd className="mt-1">Yes. The trial never charges a card, and paid plans cancel from your dashboard in two clicks.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
