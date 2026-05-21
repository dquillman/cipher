import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import { BookOpen, Bot, Target } from 'lucide-react';

const categoryConfig = {
  'Study Strategy': {
    gradient: 'from-brand-500/20 to-blue-600/10',
    icon: BookOpen,
  },
  'AI & Learning': {
    gradient: 'from-emerald-500/20 to-teal-600/10',
    icon: Bot,
  },
  'Exam Tips': {
    gradient: 'from-amber-500/20 to-orange-600/10',
    icon: Target,
  },
} as const;

type Category = keyof typeof categoryConfig;

const articles: {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  date: string;
  category: Category;
}[] = [
  {
    slug: 'how-certification-exams-think',
    title: "How Certification Exams Actually Think (And Why Your Prep Tools Don't Match)",
    excerpt: "Most prep tools drill facts. The exams test reasoning frames — Exam Lens, Security Triad, SHRM Competency. Here's the gap, and how to close it.",
    author: 'Dave',
    readTime: '5 min read',
    date: 'May 2026',
    category: 'Study Strategy',
  },
  {
    slug: 'cognitive-heatmap',
    title: "Cognitive Heatmap: How to See Exactly Where You're Weak",
    excerpt: "Overall scores tell you nothing. A heatmap maps your accuracy across Bloom's levels and exam domains, revealing your real weakness in 20 minutes.",
    author: 'Dave',
    readTime: '11 min read',
    date: 'Jun 2026',
    category: 'Study Strategy',
  },
  {
    slug: 'recall-only-prep-fails',
    title: 'Why Recall-Only Prep Fails High-Stakes Certification Exams',
    excerpt: "Flashcards and question banks stop working at around 70%. The cognitive science explains why — and what to do instead on PMP, Security+, CSM, SHRM-CP.",
    author: 'Dave',
    readTime: '10 min read',
    date: 'May 2026',
    category: 'Study Strategy',
  },
  {
    slug: 'study-by-blooms-level',
    title: "Study by Bloom's Level: The Cognitive Framework That Separates Exam Winners From Flashcard Losers",
    excerpt: "Most exam prep teaches you to remember. The PMP, Security+, and CSM test whether you can apply, analyze, and evaluate. Here's the framework that explains it.",
    author: 'Dave',
    readTime: '11 min read',
    date: 'May 2026',
    category: 'Study Strategy',
  },
  {
    slug: 'first-30-days-certification-study-plan',
    title: 'The First 30 Days: A Realistic Certification Study Plan',
    excerpt: 'A week-by-week framework for professionals who need to pass without quitting their jobs.',
    author: 'Dave',
    readTime: '9 min read',
    date: 'Jan 2026',
    category: 'Study Strategy',
  },
  {
    slug: 'how-ai-explanations-change-the-way-you-study',
    title: 'How AI-Powered Explanations Change the Way You Study',
    excerpt: 'Traditional exam prep tells you what\'s correct. AI explanations teach you why.',
    author: 'Dave',
    readTime: '6 min read',
    date: 'Feb 2026',
    category: 'AI & Learning',
  },
  {
    slug: '5-study-mistakes-that-cost-your-certification-exam',
    title: '5 Study Mistakes That Cost People Their Certification Exam',
    excerpt: 'Most exam failures aren\'t caused by lack of effort. They\'re caused by studying the wrong way.',
    author: 'Dave',
    readTime: '7 min read',
    date: 'Feb 2026',
    category: 'Exam Tips',
  },
  {
    slug: 'why-certification-exam-questions-are-so-confusing',
    title: 'Why Certification Exam Questions Are So Confusing',
    excerpt: 'The problem isn\'t your knowledge. It\'s that most exam prep teaches you the wrong skill.',
    author: 'Dave',
    readTime: '8 min read',
    date: 'Mar 2026',
    category: 'Exam Tips',
  },
];

export default function Blog() {
  return (
    <div className="bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-extrabold text-white font-display tracking-tight mb-3">Blog</h1>
          <p className="text-slate-400 mb-12">Insights on certification exam prep, reasoning, and study strategy.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((a) => {
              const cfg = categoryConfig[a.category];
              const Icon = cfg.icon;
              return (
                <Link
                  key={a.slug}
                  to={`/blog/${a.slug}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-800/50 overflow-hidden hover:border-brand-500/30 hover:bg-slate-800/60 transition-all group"
                >
                  {/* Gradient thumbnail */}
                  <div className={`h-36 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                    <Icon className="w-10 h-10 text-slate-400/60 group-hover:text-slate-300/80 transition-colors" />
                  </div>

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
