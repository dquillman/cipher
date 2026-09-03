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
 * /lp/security-plus — Tier 1 ad landing page for CompTIA Security+ candidates.
 * Copy source: cipher-marketing/04-multi-exam-landing-pages.md (LP #2).
 */
const PAGE_ID = "lp-security-plus-practice";
const SIGNUP_HREF = `/login?exam=security-plus&utm_lp=${PAGE_ID}`;

export default function SecurityPlusPracticeLP() {
  return (
    <LandingShell exam="security-plus" examShortName="Security+" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpSecurityPlus} />
      <Hero
        eyebrow="Security+ (SY0-701) · CipherExam"
        h1="Security+ punishes the wrong decision, not the missing fact."
        sub="CipherExam drills SY0-701 as scenario questions plus 16 interactive performance-based questions — drag-and-drop zoning, ordered procedures, configuration tables and a command terminal — and explains every answer through the CIA triad. Exact counts and what is still missing are below."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        videoSrc="/videos/lp/launch-teaser-secplus.mp4"
      />

      <SectionBlock>
        <p>
          Plenty of candidates pass every practice quiz at 90%+ and still walk out of the
          testing center shaken. Recognizing a term and choosing the right action under a
          scenario are different skills, and SY0-701 mostly grades the second one — in its
          multiple-choice items as much as in its Performance-Based Questions. That is the
          skill this bank is built to drill.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for Security+">
        <ol className="space-y-4">
          <li>
            <strong>16 performance-based questions that you actually operate, in practice mode.</strong>
            Drag systems into the right network zone, order the incident response phases,
            complete a firewall ruleset, or type the command that lists listening sockets
            with their owning process. Five matching items on top of that. The remaining
            97 are scenario-driven multiple choice — telemetry or an incident, and what
            to do next.
          </li>
          <li>
            <strong>CIA-triad-first explanations.</strong> Every right and wrong answer
            names the triad principle (confidentiality / integrity / availability) being
            tested <em>before</em> the control. Naming the principle first is what turns a
            five-minute stare into a thirty-second decision — on PBQs and on everything else.
          </li>
          <li>
            <strong>90-question Full Mock at exam pacing.</strong> 90 questions in 90 minutes —
            the same length CompTIA uses, drawn from all five SY0-701 domains.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="CIA triad — which principle is being protected?"
        followUp="Name the principle first. The control follows."
      />

      <TryAQuestion
        examName="Security+"
        domainLabel="Security Architecture · Cryptography"
        prompt="Which control best ensures sensitive customer records remain unaltered while transmitted across an untrusted network?"
        options={[
          { letter: "A", text: "TLS encryption" },
          { letter: "B", text: "HMAC / digital signatures" },
          { letter: "C", text: "AES-256 at rest" },
          { letter: "D", text: "RADIUS authentication" },
        ]}
        correctLetter="B"
        reasoning="The CIA principle is integrity — unaltered during transit. TLS (A) gives you confidentiality first; integrity is a side effect. HMAC and digital signatures give you integrity directly. Name the principle first; the control follows."
        bloomsLevel="Analyze"
      />

      <SectionBlock>
        <p className="text-center">
          <Link
            to={SIGNUP_HREF}
            onClick={() => trackCtaClick(`${PAGE_ID}-try-q-cta`)}
            className="inline-flex items-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Start Free Trial and try a PBQ yourself →
          </Link>
        </p>
      </SectionBlock>

      <TestimonialsSection variant="full" />

      <LeadMagnetCapture
        cluster="security-plus"
        pageId={PAGE_ID}
        headline="Free: 10 Security+ PBQ Walkthroughs"
        sub="A written guide: the CIA Triad applied to drag-drop, topology and CLI performance-based questions, with the reasoning CompTIA grades on. A study resource, not a simulator. Email it to yourself, no trial required."
      />

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">Is this current for SY0-701?</dt>
            <dd className="mt-1">Yes — the question library is built against CompTIA's published SY0-701 exam objectives.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do you simulate Performance-Based Questions?</dt>
            <dd className="mt-1">Yes, and here are the exact numbers rather than a claim. The bank is 118 questions: 97 scenario-driven multiple choice, 5 matching items, and 16 performance-based questions across four formats — drag-and-drop into zones (5), ordered procedures (4), configuration tables (4) and a simulated command line (3). What we do <em>not</em> reproduce is CompTIA's own interface chrome or its network-topology diagram items. Sixteen is a starting set, not parity with the real exam, and we would rather say so. One more thing worth knowing before you pay: the PBQs and matching items appear in practice mode, not inside the 90-question timed mock, which is multiple choice only. Take the free trial and judge them before you pay us anything, and spend an hour in CompTIA's own exam demo before test day.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">How many questions is the Full Mock?</dt>
            <dd className="mt-1">90 questions in 90 minutes — the same as CompTIA's exam.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Will this help me pass Network+ or other CompTIA certs next?</dt>
            <dd className="mt-1">Network+ (N10-009) is live with 106 questions and the same Exam Lens explanations, but the performance-based questions are Security+ only for now — Network+ and A+ are scenario-driven multiple choice today. CISSP is on the roadmap and not yet built.</dd>
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
