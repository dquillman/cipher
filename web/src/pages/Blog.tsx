import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import { SEO } from '../config/seo';
import BlogCover, { type BlogCoverKey } from '../components/blog/BlogCover';

type Category = 'Study Strategy' | 'AI & Learning' | 'Exam Tips';

// NOTE: every post MUST declare a `cover` (a BlogCoverKey). It's a required
// field, so the build fails if a new post is added without one. Design its
// matching scene in components/blog/BlogCover.tsx.
const articles: {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  date: string;
  category: Category;
  cover: BlogCoverKey;
}[] = [
  {
    slug: 'pmp-exam-changes-july-2026',
    title: 'The PMP Exam Changed in July 2026 — Is Your Prep Current?',
    excerpt: "PMI moved the PMP onto a new Exam Content Outline in July 2026. If your materials were built for the old exam, nothing in your prep will tell you — here's how to check.",
    author: 'Dave',
    readTime: '8 min read',
    date: 'Jul 2026',
    category: 'Exam Tips',
    cover: 'outline-2026',
  },
  {
    slug: 'how-certification-exams-think',
    title: "How Certification Exams Actually Think",
    excerpt: "Every exam grades against a reasoning frame — Exam Lens, Security Triad, SHRM Competency. Here's how to name the frame behind a question, and what to do when drilling more facts stops moving your score.",
    author: 'Dave',
    readTime: '5 min read',
    date: 'May 2026',
    category: 'Study Strategy',
    cover: 'reasoning-frames',
  },
  {
    slug: 'cognitive-heatmap',
    title: "Cognitive Heatmap: How to See Exactly Where You're Weak",
    excerpt: "Overall scores tell you nothing. A heatmap maps your accuracy across Bloom's levels and exam domains, revealing your real weakness in 20 minutes.",
    author: 'Dave',
    readTime: '11 min read',
    date: 'Jun 2026',
    category: 'Study Strategy',
    cover: 'heatmap',
  },
  {
    slug: 'recall-only-prep-fails',
    title: 'Why Recall-Only Prep Fails High-Stakes Certification Exams',
    excerpt: "Flashcards and question banks stop working at around 70%. The cognitive science explains why — and what to do instead on PMP, Security+, Network+ and A+.",
    author: 'Dave',
    readTime: '10 min read',
    date: 'May 2026',
    category: 'Study Strategy',
    cover: 'plateau',
  },
  {
    slug: 'study-by-blooms-level',
    title: "Study by Bloom's Level: The Cognitive Framework That Separates Exam Winners From Flashcard Losers",
    excerpt: "Most exam prep teaches you to remember. The PMP, Security+, and CSM test whether you can apply, analyze, and evaluate. Here's the framework that explains it.",
    author: 'Dave',
    readTime: '11 min read',
    date: 'May 2026',
    category: 'Study Strategy',
    cover: 'blooms',
  },
  {
    slug: 'first-30-days-certification-study-plan',
    title: 'The First 30 Days: A Realistic Certification Study Plan',
    excerpt: 'A week-by-week framework for professionals who need to pass without quitting their jobs.',
    author: 'Dave',
    readTime: '9 min read',
    date: 'May 2026',
    category: 'Study Strategy',
    cover: 'thirty-days',
  },
  {
    slug: 'how-ai-explanations-change-the-way-you-study',
    title: 'How AI-Powered Explanations Change the Way You Study',
    excerpt: 'Traditional exam prep tells you what\'s correct. AI explanations teach you why.',
    author: 'Dave',
    readTime: '6 min read',
    date: 'May 2026',
    category: 'AI & Learning',
    cover: 'ai-explain',
  },
  {
    slug: '5-study-mistakes-that-cost-your-certification-exam',
    title: '5 Study Mistakes That Cost People Their Certification Exam',
    excerpt: 'Most exam failures aren\'t caused by lack of effort. They\'re caused by studying the wrong way.',
    author: 'Dave',
    readTime: '7 min read',
    date: 'Apr 2026',
    category: 'Exam Tips',
    cover: 'five-mistakes',
  },
  {
    slug: 'why-certification-exam-questions-are-so-confusing',
    title: 'Why Certification Exam Questions Are So Confusing',
    excerpt: 'The problem isn\'t your knowledge. It\'s that most exam prep teaches you the wrong skill.',
    author: 'Dave',
    readTime: '8 min read',
    date: 'Apr 2026',
    category: 'Exam Tips',
    cover: 'confusing',
  },
];

export default function Blog() {
  return (
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead {...SEO.blogIndex} />
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-extrabold text-white font-display tracking-tight mb-3">Blog</h1>
          <p className="text-slate-400 mb-6">Insights on certification exam prep, reasoning, and study strategy.</p>

          <div className="mb-12 rounded-xl border border-brand-500/25 bg-brand-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 mb-1">Reference</div>
              <div className="text-white font-semibold">Exam Lens — the reasoning framework each cert is testing</div>
            </div>
            <Link to="/exam-lens" className="text-brand-400 hover:text-brand-300 font-semibold whitespace-nowrap">
              Read the glossary →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((a) => {
              return (
                <Link
                  key={a.slug}
                  to={`/blog/${a.slug}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-800/50 overflow-hidden hover:border-brand-500/30 hover:bg-slate-800/60 transition-all group"
                >
                  {/* Per-post cover art */}
                  <BlogCover variant={a.cover} className="h-36 w-full overflow-hidden group-hover:opacity-95 transition-opacity" />

                  <div className="p-5">
                    {/* Category badge */}
                    <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                      {a.category}
                    </span>

                    <h2 className="text-lg font-bold text-white font-display group-hover:text-brand-300 transition-colors mt-3 mb-2 leading-snug">
                      {a.title}
                    </h2>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{a.excerpt}</p>
                    <div className="text-xs text-slate-500">
                      {a.author} &middot; {a.date} &middot; {a.readTime}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
