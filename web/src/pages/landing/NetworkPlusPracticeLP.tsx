import { Link } from "react-router-dom";
import { trackCtaClick } from "../../lib/ga4";
import LandingShell, { Hero, SectionBlock, ExamLensCallout } from "./LandingShell";
import PricingCard from "./PricingCard";
import TryAQuestion from "./TryAQuestion";
import SeoHead from "../../components/SeoHead";
import { LpFaqSection, faqJsonLd, type LpFaq } from "./LpFaq";
import { SEO } from "../../config/seo";

/**
 * /lp/network-plus — Tier 1 ad landing page for CompTIA Network+ (N10-009) candidates.
 * Copy source: cipher-marketing/04-multi-exam-landing-pages.md.
 * Voice: product voice ("we"). No founder narrative — that lives at /story.
 * Compliance: testimonialBadge="none"; NO TestimonialsSection, NO LeadMagnetCapture.
 */
const PAGE_ID = "lp-network-plus-practice";
const SIGNUP_HREF = `/login?exam=network-plus&utm_lp=${PAGE_ID}`;

/**
 * FAQ — single source for the visible block AND the FAQPage schema (see LpFaq.tsx).
 * Edit here only. Inline marks: **bold**, _italic_, [text](/internal-path).
 */
const FAQS: LpFaq[] = [
  {
    q: "Is this current for N10-009?",
    a: "Yes — the question library is built against CompTIA's published N10-009 exam objectives.",
  },
  {
    q: "Do you simulate Performance-Based Questions?",
    a: "No, and we would rather you knew before paying than after. The N10-009 bank is 106 scenario-driven multiple-choice questions. We do not simulate drag-and-drop, topology or CLI items. The engine for those formats exists; the content is not written. What we drill is the layer-first troubleshooting judgment those items grade. Use the free trial to judge that for yourself, and spend an hour in CompTIA's own exam demo before test day.",
  },
  {
    q: "What makes Network+ hard?",
    a: "The troubleshooting items. They mix multiple plausible fixes, and you have to locate the fault on the OSI model before acting. The Exam Lens names the layer first, then ranks the systematic fix.",
  },
  {
    q: "How many questions is the Full Mock?",
    a: "90 questions in 90 minutes — the same length and pacing as CompTIA's exam. Scenario-driven multiple choice throughout; see the PBQ answer above.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. The 14-day trial never charges a card. Pro is month-to-month; cancel from your dashboard.",
  },
];

export default function NetworkPlusPracticeLP() {
  return (
    <LandingShell exam="network-plus" examShortName="Network+" pageId={PAGE_ID}>
      <SeoHead {...SEO.lpNetworkPlus} jsonLd={faqJsonLd(FAQS)} />
      <Hero
        eyebrow="Network+ · CipherExam"
        h1="Troubleshoot Network+ one layer at a time."
        sub="CipherExam explains every CompTIA Network+ (N10-009) answer through the Exam Lens — what OSI layer is this, and what is the systematic fix? Knowing the protocols isn't enough. Locating the symptom on the OSI model is. We drill that judgment; we do not simulate the PBQ interface."
        ctaHref={SIGNUP_HREF}
        onCtaClick={() => trackCtaClick(`${PAGE_ID}-hero`)}
        testimonialBadge="none"
      />

      <SectionBlock>
        <p>
          Most Network+ candidates memorize ports, protocols, and topologies and still freeze
          on the troubleshooting items. The reason isn't a knowledge gap — it's a frame gap.
          N10-009 grades whether you can locate a fault on the OSI model and pick the
          systematic next step, not whether you can recite a definition. Question banks that
          just drill facts can't close that gap.
        </p>
      </SectionBlock>

      <SectionBlock title="Three things compound for Network+">
        <ol className="space-y-4">
          <li>
            <strong>Layer-first practice, classified by reasoning level.</strong> Questions are
            written so you have to locate the fault on the OSI model before choosing a fix, and
            all 106 carry a Bloom's cognitive level — 20 of them Analyze, which is where the
            real troubleshooting items live. Your results separate "I forgot the port number"
            from "I could not read the symptom".
          </li>
          <li>
            <strong>Exam Lens explanations.</strong> Every right and wrong answer is walked
            through the same lens — <em>what OSI layer is this, and what is the systematic fix?</em> —
            built against the OSI model and CompTIA's published N10-009 objectives, so you
            internalize layer-by-layer troubleshooting instead of guessing.
          </li>
          <li>
            <strong>90-question Full Mock at exam pacing.</strong> 90 questions in 90 minutes —
            the same length CompTIA uses, drawn across the N10-009 domains as
            scenario-driven multiple choice.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What OSI layer is this, and what is the systematic fix?"
        followUp="Every Network+ troubleshooting question is testing this. We make the layer explicit on every explanation."
      />

      <TryAQuestion
        examName="Network+"
        domainLabel="Network Troubleshooting · OSI Model"
        prompt="Users on one access switch cannot reach the default gateway, but pings to that switch's management IP succeed from the same hosts. Where do you start troubleshooting?"
        options={[
          { letter: "A", text: "Layer 1 (physical) — reseat the uplink cable and check the SFP" },
          { letter: "B", text: "Layer 2 (data link) — verify VLAN assignment and trunk/tagging on the uplink" },
          { letter: "C", text: "Layer 3 (network) — re-IP the gateway and check its routing table" },
          { letter: "D", text: "Layer 7 (application) — restart DHCP and DNS services" },
        ]}
        correctLetter="B"
        reasoning="Apply the Exam Lens: name the layer first. Hosts can ping the switch's management IP, so connectivity up to the switch — physical link and basic data-link — is already working. That rules out a Layer 1 cable fault (A) and a host-to-switch problem. The break is reaching the gateway through this switch, which on the OSI model points to Layer 2: a wrong VLAN assignment or a misconfigured trunk/tag isolates the access ports from the path to the gateway. Per CompTIA N10-009's systematic, layer-by-layer troubleshooting, you verify VLAN and trunking before jumping to Layer 3 (C) or Layer 7 (D) — the symptom hasn't reached those layers yet."
        bloomsLevel="Analyze"
      />

      <SectionBlock>
        <p className="text-center">
          <Link
            to={SIGNUP_HREF}
            onClick={() => trackCtaClick(`${PAGE_ID}-try-q-cta`)}
            className="inline-flex items-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Start Free Trial and judge the explanations yourself →
          </Link>
        </p>
      </SectionBlock>

      <PricingCard signupHref={SIGNUP_HREF} onCtaClick={() => trackCtaClick(`${PAGE_ID}-pricing`)} />

      <LpFaqSection faqs={FAQS} />
    </LandingShell>
  );
}
