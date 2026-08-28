import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { trackCtaClick, captureUtmParams } from '../../lib/ga4';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import ArticleNav from '../../components/blog/ArticleNav';
import RelatedReading from '../../components/blog/RelatedReading';
import SeoHead from '../../components/SeoHead';
import { BLOG_POSTS, articleSchema, blogPostBreadcrumb } from '../../config/seo';

export default function HowAIExplanationsWork() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-ai-explanations');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.howAiExplanations}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.howAiExplanations, headline: BLOG_POSTS.howAiExplanations.title }), blogPostBreadcrumb('howAiExplanations')]}
      />
      <PublicNav />

      {/* Article */}
      <article className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">

          <div className="mb-8">
            <Link to="/blog" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              &larr; Back to Blog
            </Link>
          </div>

          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight leading-tight mb-4">
              How AI-Powered Explanations Change the Way You Study
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Traditional exam prep tells you what's correct. AI explanations teach you why.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>6 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <figure className="my-8">
              <img src="/blog-images/reasoning-chain.svg" alt="Comparison of a flashcard-style answer that just says 'assess impact' versus a four-step reasoning chain — frame the PMI Decision Lens, name the rule, expose the trap answer, and transfer the pattern to similar questions" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              Think about the last time you got a practice exam question wrong. What happened next?
            </p>

            <p>
              If you're like most people, you saw the correct answer, maybe read a one-sentence
              explanation, thought "okay, I'll remember that," and moved on. Ten questions later,
              you'd already forgotten the reasoning.
            </p>

            <p>
              This is the fundamental problem with traditional exam prep: the feedback loop is too thin.
              Right/wrong feedback tells you what happened but not <em>why</em> it happened or how to
              think differently next time.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What Makes AI Explanations Different
            </h2>

            <p>
              AI-powered explanations do something that static answer keys can't: they respond to
              <em> your specific answer</em>. Instead of showing a generic explanation of why option C
              is correct, they address why <em>you</em> chose option A and what thinking led you there.
            </p>

            <p>
              This distinction matters more than it might seem. When an explanation says "The correct
              answer is C because of stakeholder engagement principles," that's information. When it
              says "You chose A, which addresses the symptom. But the exam framework expects you to
              address the root cause first — that's why C is the better answer," that's learning.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-8">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                <div className="text-sm font-bold text-red-400 mb-2">Static Explanation</div>
                <p className="text-sm text-slate-400">
                  "C is correct. The project manager should engage stakeholders early in the planning process
                  to ensure alignment."
                </p>
                <p className="text-xs text-slate-500 mt-3 italic">
                  Tells you the answer. Doesn't address your thinking.
                </p>
              </div>
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-5">
                <div className="text-sm font-bold text-brand-300 mb-2">AI-Powered Explanation</div>
                <p className="text-sm text-slate-300">
                  "You chose B — updating the project plan. That's a reasonable instinct, but the PMI
                  framework treats stakeholder alignment as a prerequisite to planning changes. Without
                  stakeholder buy-in first, plan updates may need to be redone. That's why C is the
                  stronger answer here."
                </p>
                <p className="text-xs text-slate-400 mt-3 italic">
                  Addresses your choice. Teaches the framework principle.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Tutor Effect
            </h2>

            <p>
              Educational research has consistently shown that one-on-one tutoring is the most effective
              form of instruction. The reason is simple: a tutor responds to <em>your</em> specific
              misunderstandings, not generic ones.
            </p>

            <p>
              AI explanations bring a version of this to exam prep at scale. The system sees what you
              chose, understands the reasoning gap, and addresses it directly. It's not perfect — no AI
              is — but the gap between "correct answer is C" and "here's why your thinking led you to A
              and how to adjust it" is enormous.
            </p>

            <p>
              This is especially important for certification exams, where the questions are designed to
              have multiple plausible answers. The difference between wrong and right often isn't a
              knowledge gap — it's a reasoning gap. And reasoning gaps require explanation, not just
              correction.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Pattern Recognition Over Memorization
            </h2>

            <p>
              Something interesting happens when you read enough AI-powered explanations: you start
              recognizing the patterns.
            </p>

            <p>
              You notice that PMP questions about team conflict almost always test servant leadership.
              You notice that Security+ incident response questions always expect identification before
              containment. You notice that Scrum questions enforce role boundaries even when the
              "practical" answer would blur them.
            </p>

            <p>
              These patterns aren't something you can memorize from a textbook. They emerge from
              seeing the same reasoning framework applied across dozens of different scenarios. Each
              AI explanation is another data point that reinforces the framework's decision-making logic.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-8">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-3">The Pattern</div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">1.</span>
                  <span className="text-slate-300">You answer a question based on your instinct</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">2.</span>
                  <span className="text-slate-300">The AI explains why your instinct diverged from the framework</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">3.</span>
                  <span className="text-slate-300">You start to internalize the framework's priorities</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">4.</span>
                  <span className="text-slate-300">Your instinct gradually aligns with the exam's expectations</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Efficiency: Learning More in Less Time
            </h2>

            <p>
              One of the most practical benefits of detailed explanations is study efficiency.
              Traditional prep often requires you to answer 500+ questions to build confidence. With
              reasoning-based explanations, the learning per question is significantly higher.
            </p>

            <p>
              Instead of speed-running through a question bank and hoping patterns stick through
              repetition, you extract the reasoning from each question. Fifty well-reviewed questions
              with detailed breakdowns often teach more than 300 questions reviewed superficially.
            </p>

            <p>
              For working professionals juggling exam prep alongside a job and personal
              responsibilities, this efficiency difference is practical, not theoretical. Less time
              needed means the exam becomes achievable even with a demanding schedule.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Limitations
            </h2>

            <p>
              AI explanations aren't perfect. Occasionally they may oversimplify a nuanced concept or
              frame an explanation differently than a human tutor would. They work best as part of a
              broader study plan — not as a replacement for reading the foundational material.
            </p>

            <p>
              The strongest approach is to combine AI-powered practice with a solid understanding of
              the certification framework's reference material. Use the explanations to bridge the gap
              between "I know the concept" and "I can apply the concept under exam conditions."
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Why This Matters Now
            </h2>

            <p>
              Certification exams are getting harder, not easier. Exam bodies are continually updating
              their question banks to be more scenario-based, more ambiguous, and more focused on
              applied judgment. The old approach of memorizing a study guide and doing a brain dump
              on exam day is less effective than ever.
            </p>

            <p>
              AI-powered explanations represent a meaningful shift in how exam prep can work. They
              don't just tell you what's correct — they teach you the thinking that makes the correct
              answer obvious.
            </p>

            <p>
              And that's ultimately what every certification exam is testing: not what you know, but
              how you think.
            </p>
          </div>

          <ArticleNav
            prevSlug="first-30-days-certification-study-plan"
            prevTitle="The First 30 Days: A Realistic Certification Study Plan"
            nextSlug="5-study-mistakes-that-cost-your-certification-exam"
            nextTitle="5 Study Mistakes That Cost People Their Certification Exam"
          />

          {/* CTA */}
          <RelatedReading
            posts={['howExamsThink', 'studyByBloomsLevel', 'cognitiveHeatmap']}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Experience AI-powered exam explanations.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Every question on CipherExam comes with a detailed reasoning breakdown
              tailored to your answer.
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
      </article>

      <PublicFooter />
    </div>
  );
}
