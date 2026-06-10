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

export default function RecallOnlyPrepFails() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-recall-only-prep-fails');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.recallOnlyPrepFails}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.recallOnlyPrepFails, headline: BLOG_POSTS.recallOnlyPrepFails.title }), blogPostBreadcrumb('recallOnlyPrepFails')]}
      />
      <PublicNav />

      <article className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">

          <div className="mb-8">
            <Link to="/blog" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              &larr; Back to Blog
            </Link>
          </div>

          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight leading-tight mb-4">
              Why Recall-Only Prep Fails High-Stakes Certification Exams
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Flashcards and question banks stop working at around 70%. The cognitive science explains why — and what to do instead on the PMP, Security+, CSM, and SHRM-CP. The answer isn't more repetitions.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>10 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <p>
              There's a pattern every serious certification candidate eventually hits. Week 1-4: you learn new material. Practice scores climb fast. Week 5-8: scores plateau in the low 70s. Week 9+: you grind more flashcards, more question banks, more rewatch. Scores do not move.
            </p>

            <p className="text-white font-medium">
              You're not lazy. You're not unintelligent. Your prep method has a ceiling — and you've hit it.
            </p>

            <p>
              The ceiling is cognitive, not motivational. This article explains why, what the cognitive science actually says, and what to do instead.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The 70% Plateau Is Mathematical, Not Personal
            </h2>

            <p>
              Certification exams — PMP, Security+, CSM, SHRM-CP, ITIL 4, Network+, A+ Core 2, Six Sigma Green Belt — are written with a specific cognitive distribution. The average high-stakes certification exam breaks down roughly like this:
            </p>

            <figure className="my-8">
              <img src="/blog-images/ceiling-math.svg" alt="Chart showing exam composition: 20% Remember/Understand, 60% Apply/Analyze, 20% Evaluate" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              Flashcards and standard question banks train the first 20% well. They partially train the second bucket. They do not train the third bucket at all.
            </p>

            <p>
              Ceiling math: max score from pure recall training ≈ 25% (from Remember) + 30% (from easier Apply items solvable by recognition) = <strong className="text-white">~55% on a strict exam, 65-75% on a generous one.</strong>
            </p>

            <figure className="my-8">
              <img src="/blog-images/plateau-chart.svg" alt="Line chart showing recall-only prep plateau at 72% versus Bloom's-trained continuing to 93%" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p className="text-white font-medium">
              That's your plateau. You're not stuck. Your method has a ceiling, and you've reached it. Candidates who break through 80% and 90% aren't grinding harder. They're training the other two cognitive levels.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Three Cognitive Science Findings That Explain the Ceiling
            </h2>

            <h3 className="text-xl font-bold text-brand-400 font-display pt-4">1. Retrieval Is Not the Same As Application</h3>

            <p>
              The testing effect (Roediger &amp; Karpicke, 2006) established that retrieving information from memory strengthens memory more than re-reading. This is real. It's why spaced repetition works.
            </p>

            <p>
              What got mistranslated into exam prep products: <em>"if retrieval strengthens memory, and the exam tests your memory, then more retrieval = higher score."</em>
            </p>

            <p>
              This is false. The exam doesn't test your memory. It tests your ability to <em>use</em> the information you've memorized to choose the best action in a scenario you haven't seen. That's a different cognitive operation. Retrieval practice builds the raw material. It doesn't teach the use of the material.
            </p>

            <h3 className="text-xl font-bold text-brand-400 font-display pt-4">2. Transfer Is Context-Dependent</h3>

            <p>
              Decades of transfer research since Thorndike (1901): the more similar the practice context is to the test context, the better the transfer. Flashcard context is isolated question, isolated answer, instant feedback. Exam context is long scenario with irrelevant details, four plausible-sounding options, one "best" answer, time pressure. These are not similar contexts. Skill built in the flashcard context transfers poorly to the exam context.
            </p>

            <p>
              This is why candidates who can recite every PMBOK process freeze on a PMP scenario item. They built the skill in one context and are being tested in a different one.
            </p>

            <h3 className="text-xl font-bold text-brand-400 font-display pt-4">3. Recognition ≠ Production</h3>

            <p>
              Multiple-choice gives you the right answer in the options. Your job is to recognize it. Recognition is a weaker cognitive skill than production.
            </p>

            <figure className="my-8">
              <img src="/blog-images/recognition-vs-production.svg" alt="Side-by-side comparison of recognition (plateaus at 70-75 percent) versus production (scales past 90 percent)" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              If you're losing points on questions where you narrow to two answers and guess — you're operating at recognition level and the distractor designers are beating you.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Three Skills You Have to Train Separately
            </h2>

            <p>
              If your exam is Apply- and Analyze-heavy, three skills need direct training. None of them are built by flashcards.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4 space-y-5">
              <div>
                <div className="font-bold text-white mb-1">Skill 1 — Situational Pattern Matching</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Why flashcards fail:</strong> Flashcards give you the concept decontextualized. The exam gives you the scenario without naming the concept. You have to supply the concept yourself.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">How to train:</strong> Force yourself to name what framework you're applying <em>before</em> looking at the answer options. "This is a risk response selection question." "This is a Scrum anti-pattern question."</p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Skill 2 — Distractor Analysis</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Why flashcards fail:</strong> Flashcards don't have distractors.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">How to train:</strong> For every practice question, after answering, write one sentence per wrong answer explaining <em>why it's wrong</em>. Not "it's not the best answer." Why specifically.</p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Skill 3 — Tradeoff Evaluation</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Why flashcards fail:</strong> Flashcards have one right answer. The hard exam items have two defensible answers and a scoring rubric that rewards one over the other.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">How to train:</strong> "Best answer" justification writing. For every question you get down to two options on, write the explicit argument for why option A beats option B on the criteria the exam cares about.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Real Reason "Just Do More Practice Questions" Stops Working
            </h2>

            <p>
              At some point every candidate is told: <em>"just do more practice questions."</em> It's partially right. But here's what happens when you do it without the work on top:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>You memorize the question bank. Accuracy climbs. Real understanding doesn't.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>You plateau at the bank's score, not the exam's score.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>When you see a new scenario on exam day, you're back at your real skill level.</span>
              </li>
            </ul>

            <p>
              Practice questions work <strong>if</strong> you're doing distractor analysis and tradeoff evaluation on top of them. They don't work if you're just running more reps.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Prep Loop That Breaks the Plateau
            </h2>

            <ol className="space-y-3 pl-6 list-decimal marker:text-brand-400 my-4">
              <li><strong className="text-white">Diagnose by cognitive level, not topic.</strong> Find out which Bloom's level is dragging your score.</li>
              <li><strong className="text-white">Train at the level that's weak.</strong> Apply-weak? Novel scenarios. Analyze-weak? Scenarios with deliberate noise plus forced distractor writeups. Evaluate-weak? "Best answer" justification essays.</li>
              <li><strong className="text-white">Re-diagnose weekly.</strong> Level-specific weakness moves fast. A profile taken two weeks ago is stale.</li>
              <li><strong className="text-white">Keep flashcards as maintenance, not offense.</strong> 10 minutes/day to hold your recall floor. Not your primary work.</li>
            </ol>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How CIPHER Breaks This Loop Automatically
            </h2>

            <p>
              Every question in every CIPHER session is classified by Bloom's level. Your accuracy per level is tracked separately from your accuracy per topic. The study plan targets your weakest level first, using the method that trains that level.
            </p>

            <p>
              Distractor analysis is built into every question review. You see the reasoning for each wrong answer, not just the right one. Tradeoff evaluation shows up in "BEST" questions with the scoring rubric revealed in the rationale.
            </p>

            <p className="text-white font-medium">
              You don't have to design this loop. CIPHER runs it. Across all eight currently live credentials.
            </p>
          </div>

          <ArticleNav
            prevSlug="study-by-blooms-level"
            prevTitle="Study by Bloom's Level"
            nextSlug="cognitive-heatmap"
            nextTitle="Cognitive Heatmap: Where You're Actually Weak"
          />

          <RelatedReading
            posts={['studyByBloomsLevel', 'cognitiveHeatmap', 'howAiExplanations']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Stop plateauing. See what's actually blocking your score.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CIPHER's diagnostic shows your Bloom's-level weakness profile in 20 minutes. The study plan reallocates automatically.
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
