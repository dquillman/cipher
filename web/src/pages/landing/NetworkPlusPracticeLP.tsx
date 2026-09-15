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
    a: "Our Full Mock has 90 questions with a 90-minute time limit. Scenario-driven multiple choice throughout; see the PBQ answer above.",
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
          on the troubleshooting items. Knowing the definitions is only part of the work.
          Practice connecting each symptom to a test, interpreting its result, and choosing
          the next step. OSI layers can help organize that investigation, but a useful diagnosis
          also accounts for scope, recent changes, and the evidence available.
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
            drawn across the N10-009 domains as
            scenario-driven multiple choice.
          </li>
        </ol>
      </SectionBlock>

      <ExamLensCallout
        prompt="What OSI layer is this, and what is the systematic fix?"
        followUp="Use the layer as a starting hypothesis, then test it against the evidence before changing a configuration."
      />

      <TryAQuestion
        examName="Network+"
        domainLabel="Network Troubleshooting · OSI Model"
        prompt="After a trunk configuration change, hosts in VLAN 20 cannot reach their gateway. Their IP addresses and subnet masks are correct, the uplink is up, and VLAN 10 still crosses the same uplink successfully. Which check most directly tests the recent change?"
        options={[
          { letter: "A", text: "Layer 1 (physical) — reseat the uplink cable and check the SFP" },
          { letter: "B", text: "Layer 2 (data link) — verify VLAN assignment and trunk/tagging on the uplink" },
          { letter: "C", text: "Layer 3 (network) — re-IP the gateway and check its routing table" },
          { letter: "D", text: "Layer 7 (application) — restart DHCP and DNS services" },
        ]}
        correctLetter="B"
        reasoning="B tests the change most directly: check whether VLAN 20 is allowed on the trunk and whether tagging agrees at both ends. VLAN 10 crossing the uplink makes a total physical-link failure less likely; it does not prove every physical component is fault-free. The symptoms do not justify readdressing the gateway or restarting DNS. If the trunk settings are correct, continue testing the VLAN path and gateway interface instead of treating the first hypothesis as a confirmed cause."
        bloomsLevel="Analyze"
      />

      <SectionBlock title="Worked example: an IP address works, but a hostname fails">
        <p>
          A workstation can reach an internal web server by IP address, but its hostname
          does not resolve. Other users can resolve that same name. Start with a hypothesis
          about name resolution, rather than replacing a working cable or rebooting the server.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-6">
          <li><strong>Confirm the scope.</strong> Compare the exact hostname on the affected
            workstation and a working one. A misspelled name and a shared DNS outage call for
            different responses.</li>
          <li><strong>Inspect configuration.</strong> On Windows, use <code>ipconfig /all</code>
            to inspect the configured DNS servers and DNS suffix. Compare them with the expected
            settings before making changes.</li>
          <li><strong>Test name resolution.</strong> Use <code>nslookup</code> with the failing
            hostname. Compare the returned address, a nonexistent-name response, or a timeout.
            Each result supports a different next investigation; a timeout alone does not prove
            the DNS server is down.</li>
          <li><strong>Verify the outcome.</strong> After an authorized correction, retest both
            name resolution and the original application. Record the cause, change, and result.</li>
        </ol>
        <p className="mt-4">
          Reaching one server by IP establishes a working path for that test. It does not prove
          every route, firewall rule, or application is healthy. Keep conclusions as narrow as
          the evidence. This is an original study example, not an actual exam item.
        </p>
      </SectionBlock>

      <SectionBlock title="Turn a missed practice question into a useful lab">
        <ul className="list-disc space-y-3 pl-6">
          <li><strong>VLANs:</strong> draw the host-to-gateway path and identify which ports must
            carry the VLAN. Explain what an incorrect access VLAN or missing trunk allowance
            would break.</li>
          <li><strong>Addressing:</strong> calculate whether a host and its gateway are in the
            same subnet. Check the mask as well as the address before blaming routing.</li>
          <li><strong>Services:</strong> distinguish obtaining an address through DHCP from
            resolving a name through DNS. Choose a test that isolates the service in question.</li>
          <li><strong>Review:</strong> write down the observation that supports your answer and
            the additional evidence that would make another option plausible.</li>
        </ul>
        <p className="mt-4">
          Multiple-choice practice helps you explain those decisions. Pair it with hands-on
          configuration practice; this question bank does not simulate PBQ interactions.
          For the reasoning framework, see our <Link to="/exam-lens" className="underline">
          Exam Lens glossary</Link>.
        </p>
      </SectionBlock>

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
