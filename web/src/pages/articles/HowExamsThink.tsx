import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { trackCtaClick, captureUtmParams } from '../../lib/ga4';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import ArticleNav from '../../components/blog/ArticleNav';
import SeoHead from '../../components/SeoHead';
import { BLOG_POSTS, articleSchema, blogPostBreadcrumb } from '../../config/seo';

export default function HowExamsThink() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-how-certification-exams-think');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.howExamsThink}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.howExamsThink, headline: BLOG_POSTS.howExamsThink.title }), blogPostBreadcrumb('howExamsThink')]}
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
              How Certification Exams Actually Think (And Why Your Prep Tools Don't Match)
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Most prep tools drill facts. The exams test reasoning frames &mdash; Exam Lens, Security Triad, SHRM Competency. Here's the gap, and how to close it.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>5 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <figure className="my-8">
              <img src="/blog-images/exam-lenses-grid.svg" alt="Six certifications paired with the reasoning framework each one tests: PMP with PMI Decision Lens, Security+ with CIA Triad Lens, SHRM-CP with Competency Lens, ITIL 4 with Service Value Lens, CSM with Scrum Guide Lens, Six Sigma with DMAIC Lens" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              I've spent the last two years building a tool that prepares people for certification exams. The thing nobody warned me about: most prep tools are solving the wrong problem.
            </p>

            <p>
              They drill you on facts. The exams don't test facts. Not really.
            </p>

            <p>
              Take a project manager studying for the PMP. She memorizes the 49 processes, the ITTOs, the formulas. She runs flashcards until they're rote. Then she sits the exam and the first question is: <em className="text-slate-400">"A team member tells you in a 1-on-1 that another team member is taking credit for her work. What do you do?"</em>
            </p>

            <p>
              None of the answer choices are wrong, exactly. They all sound reasonable. One of them is what PMI wants you to do.
            </p>

            <p className="text-white font-medium">
              That last sentence is the whole game.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Exams test a <em>frame</em>, not a fact
            </h2>

            <p>
              When the PMI writes a question, they aren't asking what you remember. They're asking <em className="text-slate-400">whether you think like a PMI-certified professional would think.</em> That's a totally different cognitive task. You can know every fact in the PMBOK and still fail because you keep picking the answer that's <em>practically</em> right instead of the one that's <em>PMI-doctrinally</em> right.
            </p>

            <p>
              This isn't unique to PMP. Every major certification I've studied has the same structure:
            </p>

            <ul className="space-y-3 pl-6 list-disc marker:text-brand-400 my-4">
              <li>
                <strong className="text-white">CompTIA Security+</strong> isn't asking you to recite firewall rules. It's asking which principle of the CIA triad (confidentiality, integrity, availability) is being protected by a given control, and what attack vector breaks it. The reasoning frame is <em>Security Triad thinking.</em>
              </li>
              <li>
                <strong className="text-white">SHRM-CP</strong> isn't asking what HR best practice says &mdash; it's asking what a SHRM-certified HR business partner <em>would do</em> against the SHRM Body of Applied Skills and Knowledge, with all nine behavioral competencies in play. The reasoning frame is <em>SHRM Competency thinking.</em>
              </li>
              <li>
                <strong className="text-white">PMP</strong> asks what PMI would have you do. The reasoning frame is <em>Exam Lens thinking.</em>
              </li>
            </ul>

            <p>
              Each certifying body has a worldview. The exam grades you on how well you've absorbed <em>that worldview</em>, not on how well you've memorized <em>that body of knowledge</em>. Those are different things, and the practice gap between them is where almost everyone fails.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Why flashcards can't bridge it
            </h2>

            <p>
              I'll be blunt: I think most question banks are stuck at the bottom rung of Bloom's Taxonomy. They drill <em>remember</em> and <em>understand.</em> They almost never drill <em>evaluate.</em> But the certifying bodies write nearly every high-stakes question at the <em>apply / analyze / evaluate</em> level. If your prep is at level 2 and the exam is at level 5, no amount of more flashcards closes the gap. You'll just have a deeper bench of facts you can't apply.
            </p>

            <p>
              I wrote about this in detail in <Link to="/blog/study-by-blooms-level" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">Study by Bloom's Level</Link> &mdash; if you only read one post on this site, read that one. And <Link to="/blog/recall-only-prep-fails" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">Why Recall-Only Prep Fails</Link> has the cognitive-science backing.
            </p>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What we built instead
            </h2>

            <p>
              Three things, basically.
            </p>

            <ol className="space-y-4 pl-6 list-decimal marker:text-brand-400 my-4">
              <li>
                <strong className="text-white">Every question is classified by Bloom's level.</strong> When you practice, you can see whether you're answering an "evaluate"-level scenario question correctly, or just nailing the easy "remember" stuff. The <Link to="/blog/cognitive-heatmap" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">Cognitive Heatmap</Link> makes this visible.
              </li>
              <li>
                <strong className="text-white">Every explanation walks you through the exam's reasoning frame.</strong> For PMP, that's the Exam Lens &mdash; <em>what would PMI want you to do?</em> For Security+, it's the Security Triad &mdash; <em>which leg of the CIA triad is this question protecting?</em> For SHRM-CP, it's the Competency Lens &mdash; <em>which SHRM behavioral competency is being tested?</em> The framework is built into how the AI explains every answer. You don't just learn the answer; you learn the lens you're supposed to read the question through.
              </li>
              <li>
                <strong className="text-white">The system tracks your thinking traps.</strong> Not which topics you're weak on &mdash; most prep tools do that &mdash; but which <em>kinds of reasoning errors</em> you keep making. The patterns are surprisingly consistent per person.
              </li>
            </ol>

            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The shift
            </h2>

            <p>
              The first time someone tells me "the exam stopped feeling like a trick" &mdash; usually around their second or third week &mdash; it's always the same realization. They stop hunting for the right <em>fact</em> in the answer choices and start asking <em>which choice fits the lens</em>. The exam writers were never trying to fool them. They were testing whether the candidate had internalized the frame.
            </p>

            <p className="text-white font-medium">
              That's what certification exams actually test. And once you can see the frame, you can read the question the way the people who wrote it did.
            </p>

            <p>
              &mdash; Dave
            </p>
          </div>

          <ArticleNav
            prevSlug="study-by-blooms-level"
            prevTitle="Study by Bloom's Level: The Cognitive Framework That Separates Exam Winners From Flashcard Losers"
            nextSlug="recall-only-prep-fails"
            nextTitle="Why Recall-Only Prep Fails High-Stakes Certification Exams"
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Try CipherExam for 7 days, free.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              No credit card. Pick your exam, answer ten questions, and you'll see what I mean.
            </p>
            <button
              onClick={handleCta}
              className="rounded-full bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 hover:scale-105 transition-all"
            >
              Start Your Free 7-Day Trial
            </button>
            <p className="text-sm text-slate-500 mt-3">Cancel anytime.</p>
          </div>

        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
