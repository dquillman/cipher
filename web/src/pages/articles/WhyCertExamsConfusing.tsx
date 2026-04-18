import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { trackCtaClick, captureUtmParams } from '../../lib/ga4';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import ArticleNav from '../../components/blog/ArticleNav';

export default function WhyCertExamsConfusing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-why-confusing');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <PublicNav />

      {/* Article */}
      <article className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">

          {/* Meta */}
          <div className="mb-8">
            <Link to="/" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              ← Back to CipherExam
            </Link>
          </div>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight leading-tight mb-4">
              Why Certification Exam Questions Are So Confusing
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              The problem isn't your knowledge. It's that most exam prep teaches you the wrong skill.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>8 min read</span>
            </div>
          </header>

          {/* Body */}
          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <p>
              You studied for weeks. You can define every term in the glossary. You completed hundreds of
              practice questions. And then you sit down for the real exam — and the questions feel like
              they were written in a different language.
            </p>

            <p>
              If this sounds familiar, you're not alone. It's the single most common experience among
              certification exam candidates, whether they're preparing for PMP, Security+, SHRM-CP,
              or any other professional credential.
            </p>

            <p>
              The confusion isn't a flaw in the exam. It's a feature. And understanding <em>why</em> changes
              everything about how you prepare.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Memorization Trap
            </h2>

            <p>
              Most exam prep tools follow the same pattern: give you a question bank, let you answer
              questions, show you whether you got it right or wrong, and maybe display a short explanation.
            </p>

            <p>
              This approach works great for exams that test recall. What's the definition of a work
              breakdown structure? What port does HTTPS use? What does FMLA stand for?
            </p>

            <p>
              But professional certification exams rarely ask those kinds of questions.
            </p>

            <p>
              They test <strong className="text-white">judgment</strong>. They present a scenario with
              multiple answers that all sound reasonable, and they expect you to choose the one that
              reflects a specific professional framework. The answer isn't about what you <em>know</em> —
              it's about how you <em>think</em>.
            </p>

            <p>
              This is where memorization fails. You can memorize every input and output of every
              PMBOK process, but that won't help when the exam asks:
            </p>

            {/* Example Question 1 */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-8">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">Example Question</div>
              <p className="text-slate-200 font-medium mb-4">
                A project manager discovers that a team member has been consistently missing deadlines.
                The team member is highly skilled and has delivered excellent work in the past. What should
                the project manager do <strong>first</strong>?
              </p>
              <div className="space-y-2 text-sm">
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  A) Reassign the team member's tasks to someone more reliable
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  B) Document the performance issue and escalate to HR
                </div>
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  C) Have a private conversation to understand the underlying issue ✓
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  D) Add buffer time to the schedule to account for the delays
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4 border-t border-slate-700 pt-3">
                <strong className="text-brand-300">Why C?</strong> The PMI framework prioritizes servant leadership.
                Before escalating, reassigning, or adjusting the plan, the PM should understand what's actually
                happening. Options A, B, and D skip the diagnosis entirely.
              </p>
            </div>

            <p>
              Every option in that question is a real thing a project manager might do. None of them are
              obviously wrong. That's the point. The exam isn't testing whether you know what HR is — it's
              testing whether you think like a servant leader.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How Professional Exams Actually Work
            </h2>

            <p>
              Certification bodies like PMI, CompTIA, SHRM, and Scrum Alliance spend enormous resources
              developing their question banks. Each question goes through psychometric analysis to ensure
              it discriminates between candidates who truly understand the framework and those who've
              just memorized content.
            </p>

            <p>
              The techniques they use are consistent across certifications:
            </p>

            <ul className="space-y-3 pl-1">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">→</span>
                <span><strong className="text-white">Scenario-based questions</strong> that require you to interpret context before choosing an answer</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">→</span>
                <span><strong className="text-white">Plausible distractors</strong> — wrong answers that would be right in a different context</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">→</span>
                <span><strong className="text-white">"Best" answer framing</strong> — all options might be acceptable, but one aligns most closely with the framework</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">→</span>
                <span><strong className="text-white">Priority sequencing</strong> — "what should you do first?" forces you to think in process order</span>
              </li>
            </ul>

            <p>
              Once you see these patterns, you start to understand why the questions feel confusing.
              They're designed to test whether you've internalized the decision-making framework — not
              just whether you can recite it.
            </p>

            {/* Example Question 2 */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-8">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">Example Question</div>
              <p className="text-slate-200 font-medium mb-4">
                During a sprint review, a stakeholder requests a significant change to the product backlog.
                The development team believes the change will add substantial value. What should the
                Scrum Master do?
              </p>
              <div className="space-y-2 text-sm">
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  A) Add the item to the current sprint since the team agrees it's valuable
                </div>
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  B) Ensure the Product Owner adds it to the product backlog for prioritization ✓
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  C) Schedule a separate meeting to evaluate the change request
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  D) Ask the stakeholder to submit a formal change request
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4 border-t border-slate-700 pt-3">
                <strong className="text-brand-300">Why B?</strong> The Scrum framework is clear: changes don't go into
                the current sprint. The Product Owner owns the backlog. The Scrum Master's job is to facilitate
                the process, not approve changes. Option A violates sprint boundaries, C adds unnecessary
                ceremony, and D introduces a process that doesn't exist in Scrum.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Why Most Prep Tools Miss This
            </h2>

            <p>
              The majority of exam prep tools are built around question banks. You get thousands of
              questions, you practice them, and you see your score go up. It feels like progress.
            </p>

            <p>
              But there's a critical problem: <strong className="text-white">getting a question right
              by elimination or guessing teaches you nothing</strong>. And getting a question wrong with only
              a one-line explanation doesn't teach you the reasoning pattern you need to recognize.
            </p>

            <p>
              What you actually need is to understand <em>why the correct answer reflects the
              framework's thinking</em>, and <em>why your instinct led you to a different answer</em>.
              That's a fundamentally different learning experience than right/wrong feedback.
            </p>

            <p>
              Consider the difference:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-8">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                <div className="text-sm font-bold text-red-400 mb-2">Traditional Prep</div>
                <p className="text-sm text-slate-400">
                  "The correct answer is C."
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  You learn what the answer was. You don't learn why.
                </p>
              </div>
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-5">
                <div className="text-sm font-bold text-brand-300 mb-2">Reasoning-Based Prep</div>
                <p className="text-sm text-slate-300">
                  "You chose A because it addresses the immediate symptom. But the PMI framework
                  expects you to diagnose before you act. The correct answer is C because servant
                  leadership means understanding the root cause first."
                </p>
                <p className="text-xs text-slate-400 mt-2 italic">
                  You learn the thinking pattern. You'll recognize it next time.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Pattern Recognition Shift
            </h2>

            <p>
              Here's what changes when you study reasoning instead of answers: the exam stops
              feeling random.
            </p>

            <p>
              You start recognizing the patterns. "This is a servant leadership question." "This is
              testing whether I know the difference between a project manager's authority and
              the sponsor's authority." "This is checking if I follow process before taking action."
            </p>

            <p>
              Once you can categorize the <em>type</em> of reasoning a question tests, the right
              answer becomes much more obvious — even on questions you've never seen before.
            </p>

            <p>
              This is exactly how people who pass on the first attempt describe their experience.
              It's not that they memorized more. It's that they understood the exam's decision-making
              framework well enough to apply it in real time.
            </p>

            {/* Example Question 3 */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-8">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">Example Question</div>
              <p className="text-slate-200 font-medium mb-4">
                A network administrator notices unusual traffic patterns during a routine review.
                The traffic appears to originate from an internal source and is directed toward an
                external IP address on a non-standard port. What should the administrator do first?
              </p>
              <div className="space-y-2 text-sm">
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  A) Block the external IP address at the firewall immediately
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  B) Disconnect the internal source from the network
                </div>
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  C) Investigate and document the traffic to determine if it's malicious ✓
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-900/50 text-slate-400">
                  D) Report the incident to management and wait for instructions
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4 border-t border-slate-700 pt-3">
                <strong className="text-brand-300">Why C?</strong> CompTIA's security framework follows a consistent
                pattern: identify and assess before you contain. Blocking or disconnecting (A, B) might be
                necessary, but doing it without understanding the situation first could disrupt legitimate
                operations or destroy forensic evidence. The exam rewards methodical incident response.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What This Means for Your Preparation
            </h2>

            <p>
              If you're preparing for a certification exam, the most important shift you can make is
              this: stop trying to memorize the right answers and start trying to understand <em>how
              the exam thinks</em>.
            </p>

            <p>
              Every certification framework has a decision-making philosophy. PMI prioritizes servant
              leadership and process adherence. CompTIA emphasizes methodical troubleshooting and
              risk assessment. Scrum values empiricism and role clarity. SHRM focuses on ethical
              decision-making and organizational alignment.
            </p>

            <p>
              When you understand the philosophy, the questions stop feeling confusing. They start
              making sense. And that's the difference between someone who passes on the first
              attempt and someone who doesn't.
            </p>

            <p>
              The questions aren't confusing because they're poorly written. They're confusing because
              they're testing something most people never studied: <strong className="text-white">the
              reasoning behind the answer</strong>.
            </p>
          </div>

          <ArticleNav
            prevSlug="5-study-mistakes-that-cost-your-certification-exam"
            prevTitle="5 Study Mistakes That Cost People Their Certification Exam"
            nextSlug="first-30-days-certification-study-plan"
            nextTitle="The First 30 Days: A Realistic Certification Study Plan"
          />

          {/* CTA Section */}
          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              CipherExam teaches how certification exams think.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Every question comes with an AI-powered breakdown that explains the reasoning behind
              the correct answer — and why your instinct may have led you somewhere else.
            </p>
            <button
              onClick={handleCta}
              className="rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 hover:scale-105 transition-all"
            >
              Start Your Free 7-Day Trial
            </button>
            <p className="text-sm text-slate-500 mt-3">No credit card required.</p>
          </div>

        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
