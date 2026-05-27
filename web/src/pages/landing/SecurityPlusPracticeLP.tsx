import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { SEO } from "../../config/seo";

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
        h1="Stop bombing Security+ PBQs."
        sub="CipherExam runs CompTIA Security+ (SY0-701) Performance-Based Questions natively — drag-and-drop, network topology, and CLI items — and explains every answer through the CIA triad. Pass the simulator that matches the real exam."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        videoSrc="/videos/lp/launch-teaser-secplus.mp4"
      />

      <SectionBlock>
        <p>
          Most Security+ candidates pass every practice quiz at 90%+ and still walk out of
          the testing center shaken. The reason: question banks drill facts, but the real
          Security+ exam mixes MCQ with Performance-Based Questions — and PBQs test whether
          you can <em>operate</em>, not whether you can <em>recognize</em>. Flashcards can't
          close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for Security+">
        <ol className="space-y-4">
          <li>
            <strong>Native PBQ simulation.</strong> Drag-and-drop firewall rules, match
            attacks to controls, parse CLI output — the same item types CompTIA uses, not
            text approximations. This is the wedge against flashcard-only competitors.
          </li>
          <li>
            <strong>CIA-triad-first explanations.</strong> Every right and wrong answer
            names the triad principle (confidentiality / integrity / availability) being
            tested <em>before</em> the control. Naming the principle first is what makes
            PBQs feel like 30-second questions instead of 5-minute panics.
          </li>
          <li>
            <strong>90-question Full Mock at exam pacing.</strong> 90 questions in 90 minutes —
            the same length CompTIA uses. MCQ + matching + PBQ in one session.
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
            Start Free Trial to see PBQs in the simulator →
          </Link>
        </p>
      </SectionBlock>

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <SectionBlock title="Frequently asked">
        <dl className="space-y-6">
          <div>
            <dt className="font-semibold text-slate-100">Is this current for SY0-701?</dt>
            <dd className="mt-1">Yes — the question library is built against CompTIA's published SY0-701 exam objectives.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Do PBQs actually work in the simulator?</dt>
            <dd className="mt-1">Yes. Drag-and-drop, matching, and topology items are native. Not text-only approximations.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">How many questions is the Full Mock?</dt>
            <dd className="mt-1">90 questions in 90 minutes — the same as CompTIA's exam.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Will this help me pass Network+ or other CompTIA certs next?</dt>
            <dd className="mt-1">Network+ is fully live — same Bloom's classification and PBQ support, with the Exam Lens. CISSP is on the roadmap.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-100">Cancel anytime?</dt>
            <dd className="mt-1">Yes. 7-day trial never charges a card.</dd>
          </div>
        </dl>
      </SectionBlock>
    </LandingShell>
  );
}
