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

export default function CognitiveHeatmap() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-cognitive-heatmap');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.cognitiveHeatmap}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.cognitiveHeatmap, headline: BLOG_POSTS.cognitiveHeatmap.title }), blogPostBreadcrumb('cognitiveHeatmap')]}
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
              Cognitive Heatmap: How to See Exactly Where You're Weak on the PMP, Security+, and Every Other Certification You're Prepping For
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Overall scores tell you nothing. A cognitive heatmap maps your accuracy across Bloom's levels and exam domains, revealing your real weakness in under 20 minutes. Here's how to build one — and why CIPHER runs it automatically.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>11 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <p>
              Your practice test score tells you one number. It's the least useful number in your prep.
            </p>

            <p>
              "73%" doesn't tell you what to study next. It doesn't tell you whether you're weak on the material or weak on the <em>reasoning</em>. It doesn't tell you whether another two weeks of the same study plan will move the number or just waste time.
            </p>

            <p className="text-white font-medium">
              A cognitive heatmap does all three. And you can build one in under 20 minutes.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What a Cognitive Heatmap Actually Is
            </h2>

            <p>
              A heatmap is a two-axis grid. For certification prep, the axes are:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Vertical:</strong> Bloom's Taxonomy level — Remember, Understand, Apply, Analyze, Evaluate.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Horizontal:</strong> Exam domain — e.g., for PMP: People, Process, Business Environment. For Security+: Threats, Architecture, Implementation, Operations, GRC.</span>
              </li>
            </ul>

            <p>
              Every cell in the grid is your accuracy when the question is at <em>that domain</em> AND <em>that cognitive level</em>.
            </p>

            <figure className="my-8">
              <img src="/blog-images/cognitive-heatmap.svg" alt="Example cognitive heatmap showing a PMP candidate with strong Remember/Understand rows and weak Apply/Analyze/Evaluate rows" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              What you see is not "I'm weak on Risk" or "I'm weak on Apply." It's <em>"I can remember Risk material but I cannot analyze a Risk scenario."</em> Two completely different study problems. Same overall score. This is the view that tells you what to do next.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What an Overall Score Hides
            </h2>

            <p>
              Two candidates, same exam, same practice test, both score 73%.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-white mb-3">Candidate A</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Remember</span><span className="text-emerald-400 font-bold">95%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Understand</span><span className="text-emerald-400 font-bold">88%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Apply</span><span className="text-amber-400 font-bold">65%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Analyze</span><span className="text-red-400 font-bold">48%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Evaluate</span><span className="text-red-400 font-bold">42%</span></div>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-white mb-3">Candidate B</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Remember</span><span className="text-amber-400 font-bold">62%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Understand</span><span className="text-amber-400 font-bold">68%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Apply</span><span className="text-amber-400 font-bold">75%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Analyze</span><span className="text-emerald-400 font-bold">79%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Evaluate</span><span className="text-emerald-400 font-bold">80%</span></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white font-medium">
              Both at 73%. Same score. Totally different problems.
            </p>

            <p>
              Candidate A is memory-rich, reasoning-weak. More flashcards is the worst possible next move. They need scenario and "best answer" work. Candidate B is the opposite. Strong reasoning, shaky fact base. They need exactly what Candidate A needs to stop doing — more spaced repetition on the fundamentals.
            </p>

            <p>
              Give both the same advice ("study Domain 3 harder") and you hurt both. An overall score makes that misdiagnosis inevitable.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The 20-Minute DIY Heatmap
            </h2>

            <p>
              You don't need a tool to build your first heatmap. You need 20 questions, a spreadsheet, and 20 minutes.
            </p>

            <ol className="space-y-3 pl-6 list-decimal marker:text-brand-400 my-4">
              <li><strong className="text-white">Pull 20 questions</strong> from a reputable bank for your exam, spread across domains in roughly the weights the real exam uses.</li>
              <li><strong className="text-white">Classify each question by Bloom's level BEFORE answering.</strong> Write the level next to the question number.</li>
              <li><strong className="text-white">Answer, mark right/wrong, record both the level and the domain.</strong></li>
              <li><strong className="text-white">Pivot the table</strong> — accuracy by level (rows) and by domain (columns). Two clicks in a spreadsheet.</li>
              <li><strong className="text-white">Read the grid.</strong> Low cells are your real weakness.</li>
            </ol>

            <p>
              A 20-question sample is statistically noisy — trends in the heatmap are directional, not definitive. For high-confidence reads, do 100+. CIPHER's baseline diagnostic runs 100+ items automatically.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Three Most Common Heatmap Patterns
            </h2>

            <figure className="my-8">
              <img src="/blog-images/three-patterns.svg" alt="Three diagnostic patterns: the Flashcard Ceiling, the Bootcamp Blindspot, and the Domain Gap — all with same 73 percent overall score" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4 space-y-5">
              <div>
                <div className="font-bold text-white mb-1">Pattern 1 — The Flashcard Ceiling</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Signal:</strong> Strong Remember and Understand rows. Apply, Analyze, Evaluate degrade sharply.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">Fix:</strong> Rebalance time allocation. Add scenario-based Apply work. Add distractor-analysis writeups on every practice question.</p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Pattern 2 — The Bootcamp Blindspot</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Signal:</strong> Apply and Analyze are adequate. Evaluate is in the 30s or 40s.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">Fix:</strong> "Best answer" justification writing. Write the explicit argument for why one option beats another. 30 of these in a week moves Evaluate accuracy 15 points.</p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Pattern 3 — The Domain Gap</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">Signal:</strong> Otherwise strong heatmap with one weak column — a single domain weak across all Bloom's levels.</p>
                <p className="text-slate-400 text-sm mt-2"><strong className="text-slate-300">Fix:</strong> Restudy that domain with normal methods. The cognitive skill is already there — it just doesn't have material to work with.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              When Your Overall Score Lies
            </h2>

            <p>
              Overall scores lie when the exam is weighted differently than your practice bank. A practice bank with 40% Remember items will let you score 73% with weak reasoning skills. The real exam, with 20% Remember items, will score the same candidate at 58%.
            </p>

            <p>
              This is why candidates feel ambushed by real exams despite strong practice scores. Before you trust your practice score, check: does my bank match the exam blueprint? If not, your practice score is inflated.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How CIPHER Generates a Heatmap Automatically
            </h2>

            <p>
              Running the DIY version is valuable once. Running it weekly, across 100+ items, with the taxonomy applied correctly to every question, is more work than almost any candidate will actually do.
            </p>

            <p>
              CIPHER does it automatically. Every practice session and every diagnostic produces a live cognitive heatmap:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Rows:</strong> Remember, Understand, Apply, Analyze, Evaluate</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Columns:</strong> The official domains of your exam. PMP has three. Security+ has five. CSM has four. SHRM-CP has four. Each CompTIA track has its own.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Cells:</strong> Your accuracy, sample size, and confidence interval</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Trend line:</strong> How each cell has moved over the last 7 and 30 days</span>
              </li>
            </ul>

            <p>
              The study plan reads your heatmap and assigns the next session to your weakest cell, using the method that trains that cell. You stop guessing what to study next. The heatmap tells you. Every session.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What You Should Do Today
            </h2>

            <p>
              If you're more than three weeks out from your exam date and plateauing:
            </p>

            <ol className="space-y-3 pl-6 list-decimal marker:text-brand-400 my-4">
              <li>Run the 20-minute heatmap above. Find your pattern.</li>
              <li>Pattern 1 (flashcard ceiling) — cut flashcard time by 70%. Reallocate to scenario-based Apply work.</li>
              <li>Pattern 2 (bootcamp blindspot) — add 30 "best answer" justification writeups this week.</li>
              <li>Pattern 3 (domain gap) — use your existing study methods on just that domain for seven days. Redo the heatmap.</li>
            </ol>

            <p className="text-white font-medium">
              If you want the automated version — with 100+ question diagnostics, weekly re-reads, and a study plan that reallocates on its own — that's CIPHER.
            </p>
          </div>

          <ArticleNav
            prevSlug="recall-only-prep-fails"
            prevTitle="Why Recall-Only Prep Fails High-Stakes Exams"
            nextSlug="5-study-mistakes-that-cost-your-certification-exam"
            nextTitle="5 Study Mistakes That Cost People Their Certification Exam"
          />

          <RelatedReading
            posts={['studyByBloomsLevel', 'recallOnlyPrepFails', 'firstThirtyDays']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Run your cognitive heatmap in 20 minutes.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CIPHER's diagnostic builds your heatmap across your exam's official domains and all five Bloom's levels. Then the study plan targets your weakest cell automatically.
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
