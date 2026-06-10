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

export default function FirstThirtyDays() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { captureUtmParams(); }, []);

  const handleCta = () => {
    trackCtaClick('article-thirty-days');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  };

  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead
        {...BLOG_POSTS.firstThirtyDays}
        ogType="article"
        jsonLd={[articleSchema({ ...BLOG_POSTS.firstThirtyDays, headline: BLOG_POSTS.firstThirtyDays.title }), blogPostBreadcrumb('firstThirtyDays')]}
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
              The First 30 Days: A Realistic Certification Study Plan
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              A week-by-week framework for professionals who need to pass without quitting their jobs.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm text-slate-500">
              <span>By Dave, founder of CipherExam</span>
              <span className="text-slate-700">|</span>
              <span>9 min read</span>
            </div>
          </header>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">

            <figure className="my-8">
              <img src="/blog-images/thirty-day-plan.svg" alt="Four-week certification study plan timeline: Week 1 diagnose with a 20-minute cognitive baseline and heatmap, Week 2 build coverage weighted to weak domains, Week 3 simulate a full mock at exam length, Week 4 close gaps with drill on trap patterns and a second mock" className="w-full rounded-xl border border-slate-700" />
            </figure>

            <p>
              Most study plans you find online assume you have unlimited free time. "Study 4 hours per day
              for 90 days" is great advice if you don't have a job, a family, or a life. For the rest of
              us, it's fiction.
            </p>

            <p>
              This is a 30-day study plan designed for working professionals. It assumes you have 1-2
              hours per day on weekdays and maybe a longer session on weekends. It's realistic. It's
              structured. And it focuses on what actually moves the needle for certification exams.
            </p>

            <p className="text-white font-medium">
              This plan works for most certifications: PMP, Security+, CSM, SHRM-CP, ITIL, and others.
              Adjust the domain references for your specific exam.
            </p>

            {/* Week 1 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Week 1: Foundation and Baseline
            </h2>

            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Goal: Know where you stand</p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Days 1-2: Orientation</div>
                  <p className="text-slate-400">
                    Read the official exam outline from the certification body. Don't study yet — just
                    understand what's on the exam. Know the domains, the weighting, and the question format.
                    This takes 1-2 hours total.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 3-4: Diagnostic Assessment</div>
                  <p className="text-slate-400">
                    Take a diagnostic practice exam (30-50 questions covering all domains). Don't study
                    first — the point is to see where you naturally stand. Review your results by domain.
                    This becomes your baseline.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 5-7: Reference Material Skim</div>
                  <p className="text-slate-400">
                    Skim (don't deep-read) the primary reference material for your exam. Get familiar with
                    the structure, terminology, and framework philosophy. Flag sections related to your
                    weakest domains.
                  </p>
                </div>
              </div>
            </div>

            <p>
              By the end of Week 1, you should know three things: what the exam tests, where you're
              strong, and where you're weak. This information drives everything else.
            </p>

            {/* Week 2 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Week 2: Deep Dive on Weak Domains
            </h2>

            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Goal: Close the biggest gaps</p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Days 8-10: Weakest Domain</div>
                  <p className="text-slate-400">
                    Read the reference material for your lowest-scoring domain. Then do 20-30 practice
                    questions focused on that domain only. Read every explanation carefully — even for
                    questions you got right.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 11-12: Second Weakest Domain</div>
                  <p className="text-slate-400">
                    Same approach. Reference material, then targeted practice with explanation review.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 13-14: Mixed Practice</div>
                  <p className="text-slate-400">
                    Do a mixed-domain practice session (40 questions). This forces you to switch contexts
                    and apply different frameworks, which is exactly what the real exam does. Review all
                    explanations.
                  </p>
                </div>
              </div>
            </div>

            <p>
              The temptation in Week 2 is to study the topics you already know well because it feels
              productive. Resist this. The biggest score gains come from improving your weakest areas.
            </p>

            {/* Week 3 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Week 3: Reasoning Practice
            </h2>

            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Goal: Think like the exam</p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Days 15-17: Framework Drills</div>
                  <p className="text-slate-400">
                    Focus on understanding the exam's decision-making philosophy. For each practice question,
                    before looking at the answer, write down: "What principle is this testing?" Then compare
                    your assessment with the explanation.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 18-19: Distractor Analysis</div>
                  <p className="text-slate-400">
                    For every wrong answer you encounter, analyze <em>why</em> it's a plausible distractor.
                    What makes it tempting? Understanding why wrong answers look right is just as valuable
                    as knowing why right answers are right.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 20-21: Full Practice Exam</div>
                  <p className="text-slate-400">
                    Take a full-length practice exam under timed conditions. This is your mid-point check.
                    Compare your scores to your Week 1 baseline. You should see meaningful improvement in
                    your weak domains.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Week 3 is where the shift happens. You stop thinking about <em>what</em> the answer is and
              start thinking about <em>how</em> the exam makes decisions. This is the single most
              important transition in your preparation.
            </p>

            {/* Week 4 */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Week 4: Refinement and Exam Readiness
            </h2>

            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Goal: Peak confidence for exam day</p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-white mb-1">Days 22-24: Targeted Remediation</div>
                  <p className="text-slate-400">
                    Based on your Week 3 practice exam, identify any remaining weak spots. Do focused
                    practice sessions on those specific areas. This is surgical, not broad.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 25-26: Final Practice Exam</div>
                  <p className="text-slate-400">
                    Full-length, timed, exam-like conditions. Treat this like the real thing. Review results
                    but don't panic about individual questions — look at domain-level trends.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 27-28: Light Review</div>
                  <p className="text-slate-400">
                    Review your notes from the past 4 weeks. Focus on the reasoning patterns, not raw
                    content. Re-read explanations for questions you got wrong more than once.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Days 29-30: Rest and Prepare</div>
                  <p className="text-slate-400">
                    Light study only. Cramming the night before doesn't help for reasoning-based exams.
                    Get good sleep. Review logistics (test center location, required ID, appointment time).
                    Trust the work you've done.
                  </p>
                </div>
              </div>
            </div>

            {/* Time budget */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              Total Time Investment
            </h2>

            <p>
              Here's roughly what this plan requires:
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 my-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-slate-400">Weekdays (1-1.5 hrs/day)</div>
                <div className="text-white font-medium">~25-35 hours</div>
                <div className="text-slate-400">Weekends (2-3 hrs/day)</div>
                <div className="text-white font-medium">~16-24 hours</div>
                <div className="text-slate-400 border-t border-slate-700 pt-2">Total</div>
                <div className="text-brand-400 font-bold border-t border-slate-700 pt-2">~40-60 hours</div>
              </div>
            </div>

            <p>
              That's achievable for most working professionals. It's less about total hours and more about
              how you use them. Sixty hours of reasoning-based study outperforms 120 hours of passive
              re-reading.
            </p>

            {/* Closing */}
            <h2 className="text-2xl font-bold text-white font-display pt-6">
              The Key Principles
            </h2>

            <p>
              Regardless of which certification you're pursuing, these principles hold:
            </p>

            <ul className="space-y-3 pl-1 my-4">
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Diagnose before you study.</strong> Know your weak spots from Day 1.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Spend more time on explanations than questions.</strong> The learning is in the "why."</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Study the framework's priorities, not just its content.</strong> Learn how the exam thinks.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Set a date and work backward.</strong> Deadlines create focus.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                <span><strong className="text-white">Trust the process.</strong> You won't feel 100% ready. That's normal. Take the exam anyway.</span>
              </li>
            </ul>

            <p>
              Thirty days is enough. Not because certification exams are easy — they're not. But
              because focused, reasoning-based preparation is dramatically more efficient than the
              traditional "read everything and hope for the best" approach.
            </p>

            <p>
              Schedule the exam. Start the clock. You've got this.
            </p>
          </div>

          <ArticleNav
            prevSlug="why-certification-exam-questions-are-so-confusing"
            prevTitle="Why Certification Exam Questions Are So Confusing"
            nextSlug="how-ai-explanations-change-the-way-you-study"
            nextTitle="How AI-Powered Explanations Change the Way You Study"
          />

          {/* CTA */}
          <RelatedReading
            posts={['studyByBloomsLevel', 'fiveStudyMistakes', 'recallOnlyPrepFails']}
            lp={{ href: '/lp/pmp', label: 'Try CipherExam on PMP' }}
          />

          <div className="mt-16 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-white font-display mb-3">
              Start your 30-day plan with CipherExam.
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Diagnostic assessments, domain-level tracking, and AI explanations for every question.
              Everything you need for a focused 30-day prep.
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
