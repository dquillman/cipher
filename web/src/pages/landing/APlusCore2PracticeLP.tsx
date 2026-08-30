import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

/**
 * /lp/a-plus-core-2 — Tier 1 ad landing page for CompTIA A+ Core 2 (220-1202) candidates.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 * No testimonials / no lead magnet on this LP (testimonialBadge="none").
 *
 * SHIP PREREQS (companion edits outside this file):
 *  - LandingShell.tsx: widen the `exam` union to include "a-plus-core-2".
 *  - config/seo.ts: add the `lpAPlusCore2` entry (see finalSeo).
 *  - Login.tsx: add 'a-plus-core-2' -> 'cxBsVz8AVaocdEYbgSMA' to LP_EXAM_SLUG_TO_ID.
 *  - App.tsx + sitemap.xml: register the /lp/a-plus-core-2 route + URL.
 */
const PAGE_ID = "lp-a-plus-core-2-practice";
const SIGNUP_HREF = `/login?exam=a-plus-core-2&utm_lp=${PAGE_ID}`;

export default function APlusCore2PracticeLP() {
  return (
    <LandingShell exam="a-plus-core-2" examShortName="A+ Core 2" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpAPlusCore2} />
      <Hero
        eyebrow="A+ Core 2 · CipherExam"
        h1="Practice A+ Core 2 the way CompTIA grades it."
        sub="Most A+ Core 2 questions aren't asking what you know — they're asking what you do FIRST. Every CipherExam answer is explained through the Exam Lens — what step of the CompTIA troubleshooting model is this? — plus the Bloom's-level reasoning behind the question. Knowing the fix isn't enough. Knowing the order is."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Plenty of A+ Core 2 candidates know the material and still miss the scenario
          questions. The reason isn't a knowledge gap — it's a frame gap. CompTIA grades
          whether you follow its six-step troubleshooting methodology in order: identify the
          problem, establish a theory, test the theory, establish a plan, verify full
          functionality, and document. The "right" technical fix can still be the wrong
          answer if it's the wrong step. Practice tools that only drill facts can't close
          that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for A+ Core 2">
        <ol className="space-y-4">
          <li>
            <strong>Bloom's-classified practice.</strong> Every A+ Core 2 question is tagged
            by cognitive level. You see whether you're nailing easy "remember" questions but
            missing the "apply"- and "analyze"-level troubleshooting scenarios that decide the
            real exam.
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same prompt — <em>what step of the CompTIA troubleshooting model is
            this?</em> — anchored to the official CompTIA six-step methodology and the A+
            220-1202 objectives, so you internalize the order, not just the facts.
          </li>
          <li>
            <strong>90-question Full Mock at exam pacing.</strong> Same length and pacing as
            the actual exam — 90 questions in 90 minutes — drawn across the 220-1202
            objectives as scenario-driven multiple choice.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What step of the CompTIA troubleshooting model is this?"
        followUp="Every A+ Core 2 scenario question is testing this. We make it explicit on every explanation."
      />

      <TryAQuestion
        examName="A+ Core 2"
        domainLabel="Operating Systems · Troubleshooting Methodology"
        prompt="A user reports their PC has become slow. Many things could cause it — startup programs, malware, failing storage, or low memory. What should you do FIRST?"
        options={[
          { letter: "A", text: "Ask the user clarifying questions and gather information about when the slowdown started and what changed" },
          { letter: "B", text: "Open Task Manager and end the highest-CPU process" },
          { letter: "C", text: "Run a full antivirus scan because malware is the most likely cause" },
          { letter: "D", text: "Reboot the PC and document that the issue is resolved" },
        ]}
        correctLetter="A"
        reasoning="Apply the Exam Lens: what step of the CompTIA troubleshooting model is this? Answer A is step one — identify the problem — which explicitly includes gathering information from the user and asking what changed, and it must come before you establish a theory of probable cause. B opens Task Manager and acts on an unverified hunch — that skips ahead to testing a theory and establishing a plan before the problem is even scoped. C commits to a single theory (malware) with no evidence — that's establishing a theory, not identifying the problem. D verifies full functionality and documents (steps five and six) before anything was actually diagnosed. Per the CompTIA six-step methodology in the A+ 220-1202 objectives, you identify the problem before you establish, test, or act on any theory."
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
            <dt className="font-semibold text-slate-100">How long is the A+ Core 2 exam, and what's the format?</dt>
            <dd className="mt-1">The real 220-1202 exam is up to 90 questions in 90 minutes and mixes multiple choice with performance-based questions. Our Full Mock matches the length and pacing — 90 questions in 90 minutes — but is scenario-driven multiple choice throughout. See the PBQ answer below.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Is this aligned to the current A+ Core 2 objectives?</dt>
            <dd className="mt-1">Yes — the question library is built against CompTIA's published A+ 220-1202 exam objectives, including the six-step troubleshooting methodology that the scenario questions lean on.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you support performance-based questions (PBQs)?</dt>
            <dd className="mt-1">Not yet, and you should hear it here rather than after paying. The 220-1202 bank is 161 scenario-driven multiple-choice questions. We do not simulate drag-and-drop, configuration tables or CLI items — the engine for those formats is built, the content is not written. What we drill is the six-step ordering judgment those items grade. Take the free trial and judge that before you pay us anything, and spend an hour in CompTIA's own exam demo before test day.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">What makes A+ Core 2 hard?</dt>
            <dd className="mt-1">The troubleshooting scenarios. Several answers will all look technically correct — the exam is testing whether you follow CompTIA's six-step methodology in order and pick the right FIRST step, not just any valid fix. That's exactly what the Exam Lens explanation surfaces on every question.</dd>
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
