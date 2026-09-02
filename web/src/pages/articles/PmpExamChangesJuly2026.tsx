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
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
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
              The PMP Exam Changed in July 2026 &mdash; Is Your Prep Current?
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              PMI's new Exam Content Outline took effect on 9 July 2026. Here's what actually moved,
              how to check whether your study materials match the exam you'll now sit &mdash; and what
              to do if you started prepping under the old outline.
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
              and weighting &mdash; and rebuilds the question pool against it. That cycle has now turned
              over: the 2026 ECO took effect on <strong className="text-white">9 July 2026</strong>. It was
              a hard cutover, not a phase-in. The last exam delivered against the 2021 outline was
              8 July 2026. If you sit the PMP today, you sit the 2026 version.
            </p>

            <p>
              This isn't a crisis. Exam updates are routine, and the fundamentals of good project
              management don't reset overnight. But there is one real, practical risk worth taking
              seriously: <strong className="text-white">studying with materials built for the old exam.</strong>
            </p>

            <p>
              That risk is silent. Your practice questions still work. Your scores still climb. Nothing
              in your prep tells you that the blueprint underneath it moved a month ago. You only find
              out on exam day, when the emphasis feels different from everything you drilled.
            </p>

            {/* What's changing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              What Actually Changed, in Plain Terms
            </h2>

            <p>
              The outline is public now, so there's no reason to be vague about it. Every figure
              below describing <em>today's</em> exam is from PMI's <em>PMP Examination Content
              Outline &ndash; July 2026</em>, which PMI publishes as a free PDF. One caveat on the
              before-and-after comparisons: the new outline states only its own numbers &mdash; it
              never restates the ones it replaced. So in any "was X, now Y" below, the <em>now</em>
              is from the July 2026 PDF and the <em>was</em> is from the retired 2021 outline.
              Read both yourself if you want to check us &mdash; they're short.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">The domain names didn't change. The weightings did.</div>
                  <p className="text-slate-400">
                    Still People, Process, and Business Environment. But the July 2026 outline sets
                    the split at <strong className="text-slate-200">33% People, 41% Process,
                    26% Business Environment</strong> &mdash; against 42 / 50 / 8 under the retired
                    2021 outline. Business Environment more than tripled its share of the exam. If
                    your prep treats it as the small domain you skim at the end, your practice mix
                    is off by roughly a fifth of the test.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">35 tasks became 26</div>
                  <p className="text-slate-400">
                    PMI consolidated the task list: 8 tasks under People, 10 under Process, 8 under
                    Business Environment. Tasks were merged and rewritten rather than deleted, so most
                    of the underlying content survives &mdash; but it's grouped differently, which is
                    exactly what a domain-by-domain study plan is built on.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Roughly 60% is adaptive/agile and hybrid</div>
                  <p className="text-slate-400">
                    PMI states that about 40% of items represent predictive approaches, with the
                    remaining 60% split between adaptive/agile and hybrid &mdash; and that all three
                    approaches appear across all three domains, not quarantined into an "agile section."
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Same question count, ten more minutes, more formats</div>
                  <p className="text-slate-400">
                    Still 180 questions &mdash; 170 scored, 10 unscored pretest items &mdash; but the
                    clock is longer: <strong className="text-slate-200">240 minutes (4 hours)</strong>,
                    up from the 230 minutes the 2021-outline exam allowed. Ten extra minutes across
                    180 questions is not much, but if you've been pacing your mocks to the old
                    number, re-baseline. There are two 10-minute breaks; the first now falls after a
                    dedicated <em>case-study</em> section, and once you break you can't return to the
                    previous section. PMI names <strong className="text-slate-200">eight question
                    types</strong>, two of them flagged NEW &mdash; <em>Case or Scenario</em> and{' '}
                    <em>Graphic-Based</em> &mdash; alongside multiple-choice single response,
                    multiple-response, enhanced matching, point and click, matching, and pull-down
                    list. Four of the eight (enhanced matching, point and click, matching, pull-down
                    list) are computer-based-testing only; the other four appear on all modalities.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Two things worth saying plainly about that list. First, the case-study format is the
              structural change most people underestimate: one scenario, several linked questions, and
              a break boundary you can't reverse across. Second, on the perennial "which book do I
              study" question: PMI says exam questions are mapped to the ECO, and the outline itself
              calls out "noticeable differences" between it and the <em>PMBOK Guide</em>. PMI also
              states the exam isn't written according to any single text. So treat the outline as the
              blueprint and the <em>PMBOK Guide</em> as one reference among several &mdash; not the
              syllabus.
            </p>

            <p>
              And an ECO update doesn't mean everything you've learned is obsolete. Most project
              management knowledge carries straight across. What changed is the <em>emphasis</em>
              &mdash; which situations the exam presents, and which responses it rewards. That's
              exactly the part most prep materials encode implicitly, which is why stale materials are
              a problem even when their facts are still true.
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
                    date &mdash; you're looking for the July 2026 outline. If a product doesn't state
                    its ECO version anywhere, treat that silence as your answer.
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
                    "Is this aligned to the ECO that took effect on 9 July 2026?" is a yes-or-no
                    question. A vague answer &mdash; "our content covers all the fundamentals" &mdash;
                    is a no wearing a suit. So is "we're updating it soon," a month after the cutover.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">4. Compare domain structure</div>
                  <p className="text-slate-400">
                    Open the official outline PDF next to your prep tool's domain breakdown. The
                    domain names are unchanged, so names alone prove nothing &mdash; check the
                    numbers. If your tool doesn't weight Business Environment at 26%, your practice
                    scores are measuring your readiness for a different exam.
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
              carries <strong className="text-white">two PMP banks side by side</strong>: a
              <strong className="text-white"> PMP Exam v2026</strong> bank written against the July 2026
              outline, and the legacy 2021-outline bank, kept for reference rather than recommended.
              You don't have to go looking for the right one: v2026 is what every new account starts
              on. The retired bank is only reachable if you deliberately switch to it.
            </p>

            <p>
              The v2026 exam isn't a relabel. It's a distinct question bank, weighted to the new
              33 / 41 / 26 split so the mix you drill matches the mix you'll sit &mdash; including the
              much larger Business Environment share that trips up candidates carrying old habits
              forward. It runs through the same Exam Lens reasoning framework, so every explanation
              still answers the question that actually decides your score: what would PMI want you to
              do, and why do the other options fall short?
            </p>

            <p>
              Here's where the simulation stops, because you should hold us to the same audit we just
              handed you. The timing is real: our Full Mock runs 180 questions on the same 240-minute
              clock PMI allows, so pacing rehearses one-to-one. The <em>shape</em> of the sitting
              doesn't &mdash; we don't enforce PMI's two 10-minute breaks or the one-way case-study
              boundary you can't cross back over, so you control the clock in a way you won't on exam
              day. And our items are answer-selection questions: multiple choice, plus drag-and-drop
              matching and interactive EMV math where the bank uses them. We don't yet render PMI's
              newer interfaces &mdash; linked case-study sets, graphic-based items, point-and-click
              hotspots, enhanced matching, or pull-down lists. Those change how you click, not how you
              decide, which is why they're not first in our queue. For the interface itself, spend an
              hour with PMI's own exam tutorial before test day.
            </p>

            <p>
              That last part matters more right after a changeover than at any other time. Facts you
              can re-memorize in a weekend. The exam's decision-making priorities &mdash; the thing the
              new outline actually shifted &mdash; are what you need practice reasoning through. If
              you've spent time here before, you know that's our whole thesis: learn how the exam
              thinks, and updates to <em>what</em> it tests become far less disruptive.
            </p>

            {/* Bridge plan */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              You Started Under the Old Outline? A Bridge Plan
            </h2>

            <p>
              The window for "test before the change" closed on 8 July. Whatever you booked, you're
              sitting the 2026 exam. Here's how to think about each starting position:
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Mostly prepped under the 2021 outline</div>
                  <p className="text-slate-400">
                    Don't restart. Run a diagnostic against new-outline questions, see exactly where
                    the updated emphasis exposes gaps, and spend your remaining weeks there. Most of
                    your preparation still counts &mdash; the goal is to find the part that doesn't.
                    Start with Business Environment: it went from a rounding error to roughly a
                    quarter of the exam, and it's where old prep is thinnest.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Starting fresh</div>
                  <p className="text-slate-400">
                    Easiest position of the three. Read PMI's July 2026 ECO first, then make sure every
                    resource you buy states alignment to it by name and date. Ignore anything that
                    still weights the exam 42 / 50 / 8 &mdash; those are the retired 2021 numbers
                    &mdash; and be skeptical of "updated for 2026" banners on material that never
                    says what changed.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Retaking after a fail under the old exam</div>
                  <p className="text-slate-400">
                    Your score report tells you where you were weak on a blueprint that no longer
                    exists &mdash; useful, but read it with a translation layer. Re-drill your reported
                    weak domain, then reweight everything else toward the new split before you rebook.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Notice what none of these call for: panic, or starting over. An exam update rewards the
              same thing the exam itself rewards &mdash; a clear-eyed read of the situation, then a
              proportionate response.
            </p>

            {/* Closing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Honest Version of the Urgency
            </h2>

            <p>
              You saw plenty of countdown-timer marketing in the run-up to this change, and you'll now
              see plenty of "updated for 2026" badges. Most of both overstates the drama. The honest
              version is quieter, and it's this:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The date has passed.</strong> 9 July 2026 was a real cutover set by PMI, not an invented scarcity play &mdash; and it's behind us. There is no old exam to catch.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The risk is specific.</strong> It's not "the exam got harder." It's "your materials describe an exam that no longer exists" &mdash; and plenty still do.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">The fix is cheap.</strong> Five minutes auditing your materials, one read of PMI's July 2026 outline, one honest look at whether your practice mix matches 33 / 41 / 26.</span>
              </li>
            </ul>

            <p>
              Do those three things and the changeover stops being a threat. It's just a fact about
              your exam &mdash; one you've already accounted for, while a surprising number of your
              fellow candidates are still drilling for the exam that retired in July.
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
              The PMP Exam v2026 bank is built to PMI's July 2026 outline &mdash; the 33 / 41 / 26
              weighting, full-length mocks, AI explanations, and reasoning-first practice for the exam
              that's live today. Pro comes with a 60-day money-back guarantee.
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
