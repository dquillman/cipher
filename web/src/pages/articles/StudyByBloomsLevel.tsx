import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { trackCtaClick, captureUtmParams } from '../../lib/ga4';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import ArticleNav from '../../components/blog/ArticleNav';
import BloomsPyramid from '../../components/blog/BloomsPyramid';
import RelatedReading from '../../components/blog/RelatedReading';
import SeoHead from '../../components/SeoHead';
import { BLOG_POSTS, articleSchema, blogPostBreadcrumb } from '../../config/seo';

export default function StudyByBloomsLevel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-study-by-blooms-level');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.studyByBloomsLevel}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.studyByBloomsLevel, headline: BLOG_POSTS.studyByBloomsLevel.title }), blogPostBreadcrumb('studyByBloomsLevel')]}
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
              Study by Bloom's Level: The Cognitive Framework That Separates Exam Winners From Flashcard Losers
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Most exam prep teaches you to remember. The PMP, Security+, and CSM test whether you can apply, analyze, and evaluate. Here's the framework that explains it — and why it's the only one that maps to how these exams are actually written.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>11 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <p>
              If you've ever walked out of a PMP, Security+, or CSM exam thinking <em className="text-slate-400">"I knew the material — why did I fail?"</em> — this article is the answer.
            </p>

            <p>
              You didn't fail because you didn't know the material. You failed because the exam wasn't testing what you studied.
            </p>

            <p className="text-white font-medium">
              You studied to <strong>remember</strong>. The exam tested whether you could <strong>apply</strong>, <strong>analyze</strong>, and <strong>evaluate</strong>. Those are different cognitive skills. They require different study methods. And no flashcard app on the market teaches you the difference.
            </p>

            <p>
              This is the foundation of every serious professional certification — and it has a name: <strong className="text-white">Bloom's Taxonomy</strong>.
            </p>

            <figure className="my-8">
              <BloomsPyramid className="w-full rounded-xl border border-slate-700" />
            </figure>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What Bloom's Taxonomy Actually Is
            </h2>

            <p>
              In 1956, educational psychologist Benjamin Bloom published a framework that classified learning into six cognitive levels, ordered from lowest complexity to highest:
            </p>

            <ol className="space-y-2 pl-6 list-decimal marker:text-brand-400 my-4">
              <li><strong className="text-white">Remember</strong> — recall facts, terms, basic concepts</li>
              <li><strong className="text-white">Understand</strong> — explain ideas or concepts</li>
              <li><strong className="text-white">Apply</strong> — use information in new situations</li>
              <li><strong className="text-white">Analyze</strong> — draw connections, compare, contrast</li>
              <li><strong className="text-white">Evaluate</strong> — justify a decision or judgment</li>
              <li><strong className="text-white">Create</strong> — produce new or original work</li>
            </ol>

            <p>
              Seventy years later, every major credentialing body uses Bloom's — or a direct derivative of it — to write exam items.
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>The <strong className="text-white">PMP Examination Content Outline</strong> weights nearly every task toward <em>application</em> and <em>analysis</em>. PMI states explicitly that questions are situational and require judgment, not recall.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>The <strong className="text-white">CompTIA Security+</strong> blueprint includes performance-based questions designed to test <em>application</em> and <em>analysis</em> in simulated environments.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>The <strong className="text-white">Scrum Alliance CSM</strong> exam tests understanding and application of Scrum in real-team scenarios — not memorization of the Scrum Guide.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span>The <strong className="text-white">SHRM-CP</strong> exam splits items between knowledge questions (lower Bloom's) and situational judgment items (upper Bloom's), with the situational items carrying disproportionate weight.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">ITIL 4 Foundation</strong> is the rare entry-level exception — heavily Remember/Understand — but every ITIL credential above Foundation shifts immediately to Apply/Analyze.</span>
              </li>
            </ul>

            <p className="text-white font-medium">
              Read that again. The people writing your exam are using Bloom's. If you're not using Bloom's to study, you're preparing for a different test than the one you'll sit.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Cognitive Mismatch That's Costing You the Exam
            </h2>

            <p>
              Here's what typical certification prep looks like: flashcards (ITTO charts, CIA triad acronyms, Scrum events), question banks with rationales, lecture videos and bootcamps, summary sheets and cheat cards.
            </p>

            <p>
              What cognitive level do all of these train? <strong className="text-white">Remember and Understand.</strong> The bottom two rungs.
            </p>

            <p>
              What does the exam test? Primarily <strong className="text-white">Apply, Analyze, and Evaluate.</strong> The top three rungs.
            </p>

            <figure className="my-8">
              <img src="/blog-images/cognitive-mismatch.svg" alt="Diagram showing candidates studied levels Remember and Understand while the exam tested Apply, Analyze, and Evaluate" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              You're studying level 1-2 content for a level 3-5 exam. Then wondering why "knowing the material" didn't translate. This is the single biggest unforced error in certification prep. It's not laziness. It's not bad memory. It's a framework mismatch — and it's invisible to candidates because nobody teaches them to look for it.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Six Levels, Translated to How You Actually Study
            </h2>

            <p>
              Generic Bloom's explanations give you verbs ("define, classify, compare") and leave you to figure out the rest. That's useless. Here's what studying at each level actually looks like for CIPHER's supported exams.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4 space-y-5">
              <div>
                <div className="font-bold text-white mb-1">Level 1 — Remember</div>
                <p className="text-slate-400 text-sm mb-2"><strong className="text-slate-300">Example (Security+):</strong> Which port does LDAPS use by default?</p>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> Spaced repetition, flashcards, mnemonics. The only level where flashcards are the right tool. <strong className="text-white">15-20% of your study time.</strong></p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Level 2 — Understand</div>
                <p className="text-slate-400 text-sm mb-2"><strong className="text-slate-300">Example (CSM):</strong> Explain the difference between a Sprint Goal and a Product Goal.</p>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> Teach the concept out loud, from memory, without notes. Feynman technique. <strong className="text-white">15-20% of your study time.</strong></p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Level 3 — Apply</div>
                <p className="text-slate-400 text-sm mb-2"><strong className="text-slate-300">Example (PMP):</strong> A sponsor requests a major scope change mid-sprint. Three stakeholders disagree on direction. What is the project manager's BEST next action?</p>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> Practice problems with varied contexts. Never study the same scenario twice. <strong className="text-white">25-30% of your study time. This is where the exam lives.</strong></p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Level 4 — Analyze</div>
                <p className="text-slate-400 text-sm mb-2"><strong className="text-slate-300">Example (Security+):</strong> A user reports that their workstation is running slowly. The security log shows four anomalies in the past 24 hours. Which is the analyst's priority concern?</p>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> Scenario-based practice with deliberate noise. Train yourself to separate signal from distractor. <strong className="text-white">20-25% of your study time.</strong></p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Level 5 — Evaluate</div>
                <p className="text-slate-400 text-sm mb-2"><strong className="text-slate-300">Example (SHRM-CP):</strong> Given three possible responses to an employee harassment complaint, which represents the BEST use of HR resources while minimizing legal exposure?</p>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> "Best answer" practice with written justification. For every question, write why this answer beats the other three. <strong className="text-white">10-15% of your study time.</strong></p>
              </div>
              <div>
                <div className="font-bold text-white mb-1">Level 6 — Create</div>
                <p className="text-slate-400 text-sm"><strong className="text-slate-300">How to study:</strong> Performance-based simulations (Security+ PBQs, A+ Core 2 PBQs, Six Sigma improvement projects). <strong className="text-white">5-10% of your study time if applicable.</strong></p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Study-Time Allocation Most Candidates Get Wrong
            </h2>

            <figure className="my-8">
              <img src="/blog-images/study-time-allocation.svg" alt="Comparison chart showing what most candidates allocate versus what the allocation should be across Bloom's levels" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p className="text-white font-medium">
              If this surprises you, you now understand why you failed.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How to Diagnose Your Own Cognitive Weakness
            </h2>

            <p>
              Most candidates can't tell you what level they're weak at. They only know their overall score. Overall scores are useless for study planning. Run this 30-minute self-audit:
            </p>

            <ol className="space-y-3 pl-6 list-decimal marker:text-brand-400 my-4">
              <li><strong className="text-white">Pull 20 practice questions</strong> from a reputable bank for your exam.</li>
              <li><strong className="text-white">Before answering, classify each question by Bloom's level</strong> (use the verbs: <em>list/define</em> = Remember; <em>explain</em> = Understand; <em>which action/BEST step</em> = Apply; <em>priority/most relevant</em> = Analyze; <em>best response</em> = Evaluate).</li>
              <li><strong className="text-white">Answer each question.</strong> Mark right/wrong.</li>
              <li><strong className="text-white">Calculate accuracy per level.</strong> Not overall. Per level.</li>
            </ol>

            <p>
              The level with your lowest accuracy is where 80% of your remaining study time should go. Not "the domain I'm weakest in" — <em>the cognitive level I'm weakest at, across all domains</em>.
            </p>

            <p>
              Example: a PMP candidate who scores 70% overall but drills into Bloom's-level accuracy and finds 92% on Remember, 85% on Understand, 58% on Apply, 42% on Analyze. That candidate's problem isn't "I need to restudy Risk Management." It's "I can recall the material but can't choose between competing actions in scenarios." Two completely different study plans.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How CIPHER Implements This
            </h2>

            <p>
              CIPHER classifies every question in every practice session by Bloom's level. After any diagnostic, you see exactly where your cognitive profile is weak — not just "you're bad at Domain 2," but <em>"you can remember the knowledge area but can't apply it in a scenario with competing stakeholder pressure."</em>
            </p>

            <p>
              Then the study plan reallocates your time to close that specific gap, using the method that matches the level. If your weakness is Apply, you get more novel-context scenarios. If it's Analyze, you get scenarios with deliberate noise. If it's Evaluate, you get "best answer" justification drills.
            </p>

            <p className="text-white font-medium">
              It's the framework the exam writers use, applied to how you study. Across PMP, CompTIA Security+, Network+ and A+ Core 2.
            </p>
          </div>

          <ArticleNav
            prevSlug="first-30-days-certification-study-plan"
            prevTitle="The First 30 Days: A Realistic Certification Study Plan"
            nextSlug="recall-only-prep-fails"
            nextTitle="Why Recall-Only Prep Fails High-Stakes Certification Exams"
          />

          <RelatedReading
            posts={['recallOnlyPrepFails', 'cognitiveHeatmap', 'howExamsThink']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              See where you're actually weak.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CIPHER runs a cognitive-level diagnostic across every exam it supports. In about ten minutes you'll know what's really blocking your score.
            </p>
            <button
              onClick={handleCta}
              className="rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition-colors"
            >
              Start Your Free 14-Day Trial
            </button>
            <p className="text-sm text-slate-500 mt-3">No credit card required.</p>
          </div>

        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
