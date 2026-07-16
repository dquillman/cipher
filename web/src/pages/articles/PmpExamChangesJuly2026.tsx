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

export default function PmpExamChangesJuly2026() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-pmp-2026');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="decoder bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.pmpExamChanges2026}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.pmpExamChanges2026, headline: BLOG_POSTS.pmpExamChanges2026.title }), blogPostBreadcrumb('pmpExamChanges2026')]}
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
              The PMP Exam Changes in July 2026 &mdash; Is Your Prep Current?
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              PMI is updating the PMP against a new Exam Content Outline. Here's how to check whether
              your study materials match the exam you'll actually sit &mdash; and what to do if you're mid-prep.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>8 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <p>
              Every few years, PMI revisits what the PMP exam tests. It surveys the profession, updates
              the Exam Content Outline (ECO) &mdash; the blueprint that defines the exam's domains, tasks,
              and weighting &mdash; and rebuilds the question pool against it. In July 2026, that cycle
              turns over again.
            </p>

            <p>
              This isn't a crisis. Exam updates are routine, and the fundamentals of good project
              management don't reset overnight. But there is one real, practical risk worth taking
              seriously: <strong className="text-white">studying with materials built for the old exam.</strong>
            </p>

            <p>
              That risk is silent. Your practice questions still work. Your scores still climb. Nothing
              in your prep tells you that the blueprint underneath it has moved. You only find out on
              exam day, when the emphasis feels different from everything you drilled.
            </p>

            {/* What's changing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What's Changing, in Plain Terms
            </h2>

            <p>
              An Exam Content Outline update typically changes three things: which domains the exam
              covers, how tasks are described within those domains, and how much weight each area
              carries. Questions are then written and validated against the new outline, so the mix of
              scenarios you see on test day shifts to match.
            </p>

            <p>
              We're deliberately not going to list specific domain names or percentage weights here.
              The details belong to PMI, and summaries floating around the internet &mdash; including
              well-meaning ones &mdash; go stale or get them wrong. For the authoritative version,
              go straight to the source:
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Check PMI's official PMP certification page</div>
                  <p className="text-slate-400">
                    PMI publishes the current Exam Content Outline as a free PDF, along with the
                    effective date of any exam change. That document &mdash; not a blog post, not a
                    course vendor's summary &mdash; is the ground truth for what your exam will test.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Note your exam date relative to the changeover</div>
                  <p className="text-slate-400">
                    If you test before the new exam takes effect, you're preparing for the current
                    outline. If you test after, the new one. If you haven't scheduled yet, this is the
                    single most important variable in your study plan right now.
                  </p>
                </div>
              </div>
            </div>

            <p>
              One more plain-terms point: an ECO update doesn't mean everything you've learned is
              obsolete. Most project management knowledge carries straight across. What changes is the
              <em> emphasis</em> &mdash; which situations the exam presents, and which responses it
              rewards. That's exactly the part most prep materials encode implicitly, which is why
              stale materials are a problem even when their facts are still true.
            </p>

            {/* How to tell if your prep is current */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How to Tell If Your Prep Material Is Current
            </h2>

            <p>
              Most candidates never ask this question. Here's a five-minute audit you can run on any
              course, question bank, or book you're using:
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">1. Look for an explicit ECO statement</div>
                  <p className="text-slate-400">
                    Current materials say which Exam Content Outline they're aligned to, by name and
                    date. If a product doesn't state its ECO version anywhere, treat that silence as
                    your answer.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">2. Check the last-updated date</div>
                  <p className="text-slate-400">
                    A question bank last touched years ago cannot reflect an outline published after
                    it. "10,000 questions" means little if they were written for a previous exam.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">3. Ask the vendor directly</div>
                  <p className="text-slate-400">
                    "Is this aligned to the ECO that takes effect in July 2026?" is a yes-or-no
                    question. A vague answer &mdash; "our content covers all the fundamentals" &mdash;
                    is a no wearing a suit.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">4. Compare domain structure</div>
                  <p className="text-slate-400">
                    Open the official outline PDF next to your prep tool's domain breakdown. If the
                    domains, tasks, or weightings don't match, your practice scores are measuring
                    your readiness for a different exam.
                  </p>
                </div>
              </div>
            </div>

            <p>
              The pattern behind all four checks is the same: current materials are specific about
              what they align to. Outdated materials are vague, because vagueness is what lets them
              keep selling.
            </p>

            {/* How CipherExam handles it */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              How CipherExam Handles the Changeover
            </h2>

            <p>
              We didn't want our own users running that audit and finding silence. So CipherExam
              carries <strong className="text-white">two PMP exams side by side</strong>: the current
              PMP, and a separate <strong className="text-white">PMP Exam v2026</strong> bank built
              for the July 2026 content change. Both are available now.
            </p>

            <p>
              The v2026 exam isn't a relabel. It's a distinct question bank with the same full-length
              mock structure as the real thing &mdash; 180 questions, 230 minutes &mdash; and the same
              question formats, including multiple-choice, multiple-response, and matching. It runs
              through the same Exam Lens reasoning framework, so every explanation still answers the
              question that actually decides your score: what would PMI want you to do, and why do the
              other three options fall short?
            </p>

            <p>
              That last part matters more across a changeover than at any other time. Facts you can
              re-memorize in a weekend. The exam's decision-making priorities &mdash; the thing the
              new outline actually shifts &mdash; are what you need practice reasoning through. If
              you've spent time here before, you know that's our whole thesis: learn how the exam
              thinks, and updates to <em>what</em> it tests become far less disruptive.
            </p>

            {/* Bridge plan */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Mid-Prep During the Changeover? A Bridge Plan
            </h2>

            <p>
              The hardest position is being partway through your prep with the change approaching.
              Here's how to think about each scenario:
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Testing before the changeover</div>
                  <p className="text-slate-400">
                    Stay the course. You're preparing for the current exam, and switching materials
                    now would cost you momentum for no benefit. Schedule your exam if you haven't
                    &mdash; a real date with buffer before the change is worth more than an open-ended
                    plan that drifts past it.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Testing after the changeover</div>
                  <p className="text-slate-400">
                    Prepare against the new outline from day one. Read PMI's updated ECO first, then
                    make sure every practice resource you use states alignment to it. Your existing
                    knowledge transfers; your practice-question mix should not be inherited from the
                    old exam.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Not scheduled yet, could go either way</div>
                  <p className="text-slate-400">
                    Decide this week, based on honest math. If you can be ready 2&ndash;3 weeks before
                    the changeover with time to spare, book the current exam. If that timeline requires
                    everything to go perfectly, plan for the new exam instead &mdash; a rushed attempt
                    against a deadline is the worst of both worlds.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Straddling it: mostly prepped, testing after</div>
                  <p className="text-slate-400">
                    Don't restart. Run a diagnostic against new-outline questions, see exactly where
                    the updated emphasis exposes gaps, and spend your remaining weeks there. Most of
                    your preparation still counts &mdash; the goal is to find the part that doesn't.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Notice what none of these scenarios call for: panic, or starting over. An exam update
              rewards the same thing the exam itself rewards &mdash; a clear-eyed read of the situation,
              then a proportionate response.
            </p>

            {/* Closing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Honest Version of the Urgency
            </h2>

            <p>
              You'll see plenty of countdown-timer marketing around this change. Most of it
              overstates the drama. The honest version is quieter, and it's this:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The date is real.</strong> July 2026 is a genuine deadline set by PMI, not an invented scarcity play.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The risk is specific.</strong> It's not "the exam got harder." It's "your materials may describe an exam that no longer exists."</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The fix is cheap.</strong> Five minutes auditing your materials, one read of PMI's official outline, one deliberate scheduling decision.</span>
              </li>
            </ul>

            <p>
              Do those three things and the changeover stops being a threat. It's just a fact about
              your exam &mdash; one you've already accounted for, while a surprising number of your
              fellow candidates haven't.
            </p>
          </div>

          <ArticleNav
            prevSlug="cognitive-heatmap"
            prevTitle="Cognitive Heatmap: How to See Exactly Where You're Weak"
          />

          <RelatedReading
            posts={['howExamsThink', 'firstThirtyDays', 'studyByBloomsLevel']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Prep for the exam you'll actually sit.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              CipherExam carries both the current PMP and the PMP Exam v2026 bank &mdash; full-length
              mocks, AI explanations, and reasoning-first practice for whichever side of the changeover
              you're on. Pro comes with a 60-day money-back guarantee.
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
