import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { trackCtaClick } from '../lib/ga4';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import { breadcrumbSchema } from '../config/seo';

type LensEntry = {
  exam: string;
  examSlug: string;            // e.g. 'pmp' — for the LP link
  lpHref?: string;             // present only for Tier 1 exams (PMP / Sec+ / SHRM-CP)
  lensName: string;
  prompt: string;
  body: string;
  example: { question: string; lensApplied: string };
};

const LENSES: LensEntry[] = [
  {
    exam: 'PMP',
    examSlug: 'pmp',
    lpHref: '/lp/pmp',
    lensName: 'PMI Decision Lens',
    prompt: 'What would PMI want you to do?',
    body:
      'PMP questions test judgment, not project-management facts. Multiple answers will look defensible. The PMI Decision Lens names the rule PMI applies to rank them: gather data before acting, communicate with stakeholders, and follow process even when shortcuts feel reasonable.',
    example: {
      question: 'A scope change lands mid-sprint. What should the project manager do FIRST?',
      lensApplied: '"Assess impact" beats "escalate" because PMI ranks data-gathering above communication.',
    },
  },
  {
    exam: 'CompTIA Security+',
    examSlug: 'security-plus',
    lpHref: '/lp/security-plus',
    lensName: 'CIA Triad Lens (Security Triad Lens)',
    prompt: 'Which principle is being protected — Confidentiality, Integrity, or Availability?',
    body:
      'Security+ questions almost always test which leg of the CIA triad is at stake. The same control can serve different principles depending on context; the Lens forces you to name the principle before picking the control.',
    example: {
      question: 'A backup-and-restore plan was just deployed. Which CIA principle does it primarily serve?',
      lensApplied: '"Availability" beats "Integrity" because the control restores systems, not data correctness.',
    },
  },
  {
    exam: 'SHRM-CP',
    examSlug: 'shrm-cp',
    lpHref: '/lp/shrm-cp',
    lensName: 'SHRM Competency Lens',
    prompt: 'Which SHRM behavioral competency does this scenario test?',
    body:
      'SHRM-CP situational items have multiple defensible HR responses. The Lens names the SHRM behavioral competency the scenario is actually grading — Communication, Ethical Practice, Business Acumen, and so on — and selects the option that aligns with that competency.',
    example: {
      question: 'An employee complains about a peer\'s tone in a meeting. What should HR do FIRST?',
      lensApplied: '"Document and gather facts" beats "mediate" because the Lens points to Ethical Practice / due process.',
    },
  },
  {
    exam: 'Six Sigma Green Belt',
    examSlug: 'six-sigma',
    lpHref: '/lp/six-sigma',
    lensName: 'DMAIC Lens',
    prompt: 'Where in Define-Measure-Analyze-Improve-Control does this fall?',
    body:
      'Six Sigma questions ask you to place an action in the DMAIC sequence. The Lens forces you to name the phase before naming the tool — because the right tool changes phase by phase.',
    example: {
      question: 'A team builds a fishbone diagram. Which DMAIC phase are they in?',
      lensApplied: '"Analyze" — fishbones surface root causes, which is Analyze\'s purpose, not Measure\'s.',
    },
  },
  {
    exam: 'CPP (Certified Payroll Professional)',
    examSlug: 'cpp',
    lensName: 'Payroll Compliance Lens',
    prompt: 'What does federal / state payroll law require here?',
    body:
      'CPP questions are compliance-anchored. The Lens names the regulation (FLSA, state wage law, ERISA, etc.) the question is checking before you reach for the procedural answer.',
    example: {
      question: 'A non-exempt employee works 50 hours. What overtime rule applies?',
      lensApplied: '"FLSA — 1.5× regular rate on hours above 40" beats "company policy" because federal preempts.',
    },
  },
  {
    exam: 'CIA Part 1',
    examSlug: 'cia',
    lpHref: '/lp/cia',
    lensName: 'IIA Standards Lens',
    prompt: 'What do the IIA International Standards say?',
    body:
      'Internal-audit questions are governed by the IIA International Standards of Practice. The Lens names the specific Standard (or Attribute / Performance section) the scenario is exercising before you choose a procedural answer.',
    example: {
      question: 'A board asks the chief audit executive to audit a brand-new division. What should the CAE do?',
      lensApplied: '"Assess competence and resources first" — Standard 1210 (Proficiency) precedes the engagement.',
    },
  },
  {
    exam: 'ITIL 4 Foundation',
    examSlug: 'itil',
    lpHref: '/lp/itil',
    lensName: 'Service Value Lens',
    prompt: 'How does this serve the ITIL service value chain?',
    body:
      'ITIL 4 questions test whether you can trace an activity back to the service value chain — engage, plan, improve, design & transition, obtain/build, deliver & support. The Lens names the value-chain step before picking the practice.',
    example: {
      question: 'A new monitoring tool is rolled out to ops. Which ITIL value-chain activity is this?',
      lensApplied: '"Design & transition" beats "improve" because the tool is being deployed, not iterated on yet.',
    },
  },
  {
    exam: 'Certified ScrumMaster (CSM)',
    examSlug: 'csm',
    lpHref: '/lp/csm',
    lensName: 'Scrum Guide Lens',
    prompt: 'What does the Scrum Guide say the role should do?',
    body:
      'CSM questions test fidelity to the Scrum Guide, not general agility. The Lens forces you to identify which Scrum role owns the decision (Scrum Master, Product Owner, Developers) and what the Guide explicitly says about it.',
    example: {
      question: 'A stakeholder pushes a feature mid-sprint. Who decides?',
      lensApplied: '"Product Owner — and only if scope changes don\'t threaten the Sprint Goal" per the Scrum Guide.',
    },
  },
  {
    exam: 'CompTIA Network+',
    examSlug: 'network-plus',
    lpHref: '/lp/network-plus',
    lensName: 'OSI Troubleshooting Lens',
    prompt: 'What OSI layer is this, and what\'s the systematic fix?',
    body:
      'Network+ troubleshooting questions test whether you can locate the symptom on the OSI model before applying a fix. The Lens names the layer first — physical, data link, network, transport, session, presentation, or application — then ranks fixes for that layer.',
    example: {
      question: 'Users on one switch can\'t reach the gateway. Pings to the switch itself work. Where to start?',
      lensApplied: '"Layer 2 (data link) — check VLAN config" beats "Layer 3" because L2 still functions to the switch.',
    },
  },
  {
    exam: 'CompTIA A+ Core 2',
    examSlug: 'a-plus-core-2',
    lpHref: '/lp/a-plus-core-2',
    lensName: 'Troubleshooting Methodology Lens',
    prompt: 'What step of the CompTIA troubleshooting model is this?',
    body:
      'A+ Core 2 questions reward following CompTIA\'s six-step troubleshooting model (identify the problem, establish a theory, test, plan, verify, document). The Lens forces you to name the current step before picking the next action.',
    example: {
      question: 'A user reports their PC is slow. Multiple things could cause it. What FIRST?',
      lensApplied: '"Identify the problem — ask the user clarifying questions" precedes "establish a theory."',
    },
  },
  {
    exam: 'PgMP',
    examSlug: 'pgmp',
    lpHref: '/lp/pgmp',
    lensName: 'Program Governance Lens',
    prompt: 'How does this serve the program\'s strategic objectives and benefits realization?',
    body:
      'PgMP questions step up from PMP\'s project-level frame to program-level governance. The Lens asks whether the action serves a strategic objective and contributes to benefits realization — not whether it\'s tactically efficient.',
    example: {
      question: 'A component project is on budget but no longer maps to a benefit. What should the program manager do?',
      lensApplied: '"Recommend cancellation" beats "complete and re-plan" because governance prioritizes benefits, not sunk cost.',
    },
  },
];

export default function ExamLensGlossary() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCta = () => {
    trackCtaClick('exam-lens-glossary');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  // Glossary schema — multiple Things, one per Lens. Helps Google build entity graph.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Exam Lens — CipherExam reasoning frameworks',
      description:
        'Per-certification reasoning frameworks that CipherExam uses to explain answers. Each Lens names what the exam is actually grading.',
      hasDefinedTerm: LENSES.map((l) => ({
        '@type': 'DefinedTerm',
        name: l.lensName,
        description: l.body,
        termCode: l.examSlug,
      })),
    },
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Exam Lens', path: '/exam-lens' },
    ]),
  ];

  return (
    <div className="decoder bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        title="Exam Lens — Per-Certification Reasoning Frameworks · CipherExam"
        description="Exam Lens is CipherExam's name for the per-certification reasoning frameworks that explain why one answer is BEST. Glossary of every Lens — PMP, Security+, SHRM-CP, ITIL, Scrum, Six Sigma, CIA, CPP, Network+, A+, PgMP."
        canonical="/exam-lens"
        jsonLd={jsonLd}
      />
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-3">
              Glossary
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight leading-tight mb-4">
              Exam Lens — the reasoning framework each cert is actually testing
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Most prep tools teach you facts. The exams test how you <em>think</em>. Exam Lens is CipherExam's
              name for the per-certification reasoning framework that decides which defensible answer is
              actually BEST. One Lens per cert. Here's every one.
            </p>
          </header>

          <div className="space-y-12">
            {LENSES.map((lens) => (
              <article
                key={lens.examSlug}
                id={lens.examSlug}
                className="border-l-2 border-slate-800 pl-6"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-2">
                  {lens.exam}
                </div>
                <h2 className="text-2xl font-bold text-white font-display mb-3">
                  {lens.lensName}
                </h2>
                <p className="text-base text-slate-300 italic mb-4">
                  Prompt: <span className="text-white">"{lens.prompt}"</span>
                </p>
                <p className="text-base text-slate-300 leading-relaxed mb-5">{lens.body}</p>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5 text-sm">
                  <div className="text-slate-400 mb-2">
                    <strong className="text-slate-300">Example:</strong> {lens.example.question}
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-brand-400">Lens applied:</strong> {lens.example.lensApplied}
                  </div>
                </div>
                {lens.lpHref ? (
                  <p className="mt-4 text-sm">
                    <Link
                      to={lens.lpHref}
                      className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
                    >
                      Practice {lens.exam} with {lens.lensName} explanations →
                    </Link>
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              See an Exam Lens explanation on every question.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CipherExam writes the reasoning chain — Lens, rule, trap, transfer — for every practice
              question. Right or wrong, you learn the pattern.
            </p>
            <button
              onClick={handleCta}
              className="rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition-colors"
            >
              Start Your Free 7-Day Trial
            </button>
            <p className="text-sm text-slate-500 mt-3">No credit card required.</p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
