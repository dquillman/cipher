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

export default function FiveStudyMistakes() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-five-mistakes');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="decoder bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.fiveStudyMistakes}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.fiveStudyMistakes, headline: BLOG_POSTS.fiveStudyMistakes.title }), blogPostBreadcrumb('fiveStudyMistakes')]}
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
              5 Study Mistakes That Cost People Their Certification Exam
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Most exam failures aren't caused by lack of effort. They're caused by studying the wrong way.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>7 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <figure className="my-8">
              <img src="/blog-images/five-mistakes.svg" alt="Five numbered study mistakes that cost certification candidates the exam: re-reading what you already know, memorizing without classifying by Bloom's level, ignoring explanations on questions you got right, skipping the simulator until you're ready, and studying domains evenly instead of weighted to weaknesses" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              Every year, thousands of professionals sit for certification exams confident they're ready —
              and walk out wondering what went wrong. The failure rates for exams like PMP, Security+, and
              SHRM-CP are significant, and the pattern behind those failures is remarkably consistent.
            </p>

            <p>
              It's rarely about not studying enough. It's about studying the wrong way.
            </p>

            <p>
              Here are five mistakes that cost candidates their exam — and what to do instead.
            </p>

            {/* Mistake 1 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              1. Treating It Like a College Exam
            </h2>

            <p>
              In college, the formula is straightforward: memorize the material, recall it on test day, pass.
              Professional certification exams don't work this way.
            </p>

            <p>
              Certifications test <strong className="text-white">applied judgment</strong>, not recall. The
              questions present realistic scenarios and ask you to choose the best course of action based on
              a professional framework. Memorizing definitions won't help when every answer option sounds
              reasonable.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-6">
              <div className="text-sm font-bold text-brand-300 mb-2">What to do instead</div>
              <p className="text-sm text-slate-400">
                Focus on understanding <em>how</em> the certification framework makes decisions. For PMP,
                that means servant leadership and stakeholder engagement. For Security+, it means methodical
                risk assessment. Learn the thinking pattern, not just the vocabulary.
              </p>
            </div>

            {/* Mistake 2 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              2. Grinding Question Banks Without Reviewing
            </h2>

            <p>
              Doing 500 practice questions feels productive. But if you're just checking whether you got the
              right answer and moving on, you're building false confidence. You might even start memorizing
              specific question-answer pairs — which is useless because the real exam uses completely
              different questions.
            </p>

            <p>
              The value of a practice question isn't in the answer. It's in understanding <em>why</em> the
              correct answer is correct and why your choice was wrong.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-6">
              <div className="text-sm font-bold text-brand-300 mb-2">What to do instead</div>
              <p className="text-sm text-slate-400">
                Spend more time reviewing explanations than answering questions. After every wrong answer,
                ask: "What reasoning pattern did this question test? What framework principle did I miss?"
                That reflection is where real learning happens.
              </p>
            </div>

            {/* Mistake 3 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              3. Ignoring Weak Domains
            </h2>

            <p>
              Human nature pushes us toward comfort. If you're strong in project scheduling but weak in
              stakeholder engagement, you'll naturally gravitate toward scheduling questions. It feels
              good to get answers right.
            </p>

            <p>
              But certification exams test across all domains. A passing score requires competency
              everywhere, not mastery in one area. The domains you avoid studying are exactly where the
              exam will catch you.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-6">
              <div className="text-sm font-bold text-brand-300 mb-2">What to do instead</div>
              <p className="text-sm text-slate-400">
                Track your performance by domain. Identify which areas consistently have the lowest scores
                and spend disproportionate time there. A 10% improvement in your weakest domain is worth
                more than a 10% improvement in your strongest.
              </p>
            </div>

            {/* Mistake 4 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              4. Studying for Too Long Without a Deadline
            </h2>

            <p>
              "I'll take the exam when I feel ready" is one of the most dangerous study plans. Without a
              fixed date, preparation stretches indefinitely. You review the same material over and over.
              Motivation fades. The exam feels increasingly intimidating because you keep raising the bar
              for "ready."
            </p>

            <p>
              Most successful candidates report that they never felt fully ready. They scheduled the exam,
              prepared with focus, and trusted the process.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-6">
              <div className="text-sm font-bold text-brand-300 mb-2">What to do instead</div>
              <p className="text-sm text-slate-400">
                Book your exam date first, then work backward. Give yourself 4-8 weeks depending on the
                certification. Having a fixed deadline creates urgency and forces you to prioritize what
                matters most.
              </p>
            </div>

            {/* Mistake 5 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              5. Using Only One Study Resource
            </h2>

            <p>
              Relying on a single textbook or one video course creates a narrow understanding. You learn
              one author's interpretation of the framework, which may not match how the exam frames
              questions. When the real exam presents a concept from a different angle, it feels unfamiliar.
            </p>

            <p>
              Certification bodies deliberately write questions that can't be answered by memorizing one
              source. They want to ensure you genuinely understand the concepts, not just one author's
              explanation of them.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-6">
              <div className="text-sm font-bold text-brand-300 mb-2">What to do instead</div>
              <p className="text-sm text-slate-400">
                Combine multiple study methods: a primary reference guide, practice questions with detailed
                explanations, and scenario-based reasoning practice. The overlap between sources reinforces
                concepts; the differences between them build flexibility in your thinking.
              </p>
            </div>

            {/* Closing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Common Thread
            </h2>

            <p>
              All five mistakes share the same root cause: studying for the exam you expect instead of the
              exam you'll actually face. Certification exams are designed to test professional judgment
              under ambiguity. They reward candidates who understand the decision-making framework and
              penalize those who only memorized content.
            </p>

            <p>
              The good news is that once you shift your approach from memorization to reasoning, the exam
              becomes significantly more manageable. You stop being surprised by questions and start
              recognizing what they're really asking.
            </p>

            <p>
              That shift is exactly what separates candidates who pass on the first attempt from those
              who don't.
            </p>
          </div>

          <ArticleNav
            prevSlug="how-ai-explanations-change-the-way-you-study"
            prevTitle="How AI-Powered Explanations Change the Way You Study"
            nextSlug="why-certification-exam-questions-are-so-confusing"
            nextTitle="Why Certification Exam Questions Are So Confusing"
          />

          {/* CTA */}
          <RelatedReading
            posts={['whyConfusing', 'firstThirtyDays', 'recallOnlyPrepFails']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Study the reasoning, not just the answers.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CipherExam breaks down the logic behind every question so you understand the framework,
              not just the content.
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
