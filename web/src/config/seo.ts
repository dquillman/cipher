/**
 * Per-route SEO metadata. Single source of truth — when copy changes, edit here.
 *
 * Used by each public page via:
 *   import { SEO } from '../config/seo';
 *   <SeoHead {...SEO.pmpLp} />
 */

const SITE = 'https://cipherexam.com';
const ORG_REF = { '@id': `${SITE}/#org` };

export const SEO = {
  landing: {
    title: 'CipherExam — Learn How Certification Exams Think',
    description:
      'AI-powered certification exam prep that explains the reasoning behind every question. 11+ certifications: PMP, Security+, SHRM-CP, and more. Free 7-day trial, no credit card.',
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'CipherExam',
      url: SITE + '/',
      isPartOf: { '@id': `${SITE}/#website` },
      about: 'Certification exam preparation with AI-explained reasoning',
    },
  },

  pricing: {
    title: 'Pricing — $0 Free or $19/mo Pro · CipherExam',
    description:
      'Free Starter forever, or Pro at $19/month (save 17% yearly). 7-day free trial. No credit card required. Cancel anytime.',
    canonical: '/pricing',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'CipherExam Pro',
        description:
          'AI-powered cert exam prep with unlimited AI quizzes, full exam simulators, detailed domain analytics, AI-powered study plans.',
        brand: { '@type': 'Brand', name: 'CipherExam' },
        offers: [
          {
            '@type': 'Offer',
            name: 'Pro Monthly',
            price: '19',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: SITE + '/pricing',
            priceValidUntil: '2027-12-31',
          },
          {
            '@type': 'Offer',
            name: 'Pro Yearly',
            price: '190',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: SITE + '/pricing',
            priceValidUntil: '2027-12-31',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is there a free trial?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. CipherExam Pro includes a 7-day free trial. No credit card required to start.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I cancel anytime?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. You can cancel your subscription at any time from your account settings.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which certifications are included?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PMP, Certified ScrumMaster, SHRM-CP, Six Sigma Green Belt, Certified Payroll Professional, CIA Part 1, ITIL 4 Foundation, CompTIA Security+, CompTIA Network+, CompTIA A+ Core 2, and PgMP. CISSP and AWS SAA coming soon.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is CipherExam different from other prep tools?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every question is classified by Bloom’s Taxonomy and explained through an exam-specific reasoning framework (Exam Lens). You learn how the exam thinks, not just the answer.',
            },
          },
        ],
      },
    ],
  },

  story: {
    title: 'Why I Built CipherExam — Founder Story',
    description:
      'Cert exams test how professionals think, not what they memorize. Why I built CipherExam to teach the reasoning. — Dave, founder.',
    canonical: '/story',
    ogType: 'article' as const,
    ogImage: 'https://cipherexam.com/og-story.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: SITE + '/story',
      mainEntity: { '@type': 'Person', name: 'Dave Quillman', jobTitle: 'Founder, CipherExam' },
      publisher: ORG_REF,
    },
  },

  about: {
    title: 'About CipherExam — Certification Prep, Decoded',
    description:
      'CipherExam helps you understand how certification exams think. AI-powered explanations, Bloom’s-classified questions, per-exam reasoning frameworks.',
    canonical: '/about',
  },

  blogIndex: {
    title: 'The CipherExam Blog — Certification Prep, Decoded',
    description:
      'Cognitive-science-backed cert prep writing. Bloom’s taxonomy, exam reasoning, study strategies for PMP, Security+, SHRM-CP and more.',
    canonical: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      url: SITE + '/blog',
      publisher: ORG_REF,
    },
  },

  lpPmp: {
    title: 'PMP Practice — AI-Explained Questions · CipherExam',
    description:
      'Practice PMP exam questions with AI-explained reasoning. Bloom’s-classified, scenario-aware, with the PMI Decision Lens. Free 7-day trial.',
    canonical: '/lp/pmp',
    ogImage: 'https://cipherexam.com/og-pmp.png',
  },

  lpSecurityPlus: {
    title: 'CompTIA Security+ Practice — PBQ-Native · CipherExam',
    description:
      'Practice Security+ (SY0-701) with full PBQ support and reasoning explanations through the Security Triad Lens. Free 7-day trial.',
    canonical: '/lp/security-plus',
    ogImage: 'https://cipherexam.com/og-security-plus.png',
  },

  lpShrmCp: {
    title: 'SHRM-CP Practice — Competency-Lens Questions · CipherExam',
    description:
      'Practice SHRM-CP questions tied to the SHRM behavioral competencies, with AI-explained reasoning. Free 7-day trial.',
    canonical: '/lp/shrm-cp',
    ogImage: 'https://cipherexam.com/og-shrm-cp.png',
  },

  terms: {
    title: 'Terms of Service · CipherExam',
    description: 'CipherExam terms of service.',
    canonical: '/terms',
  },

  privacy: {
    title: 'Privacy Policy · CipherExam',
    description: 'CipherExam privacy policy.',
    canonical: '/privacy',
  },
} as const;

/**
 * Build Article JSON-LD for blog posts. Headline + datePublished are required;
 * everything else has a sensible default.
 */
export function articleSchema(opts: {
  headline: string;
  description: string;
  canonical: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: SITE + opts.canonical,
    author: { '@type': 'Person', name: 'Dave Quillman' },
    publisher: ORG_REF,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    image: opts.image ?? SITE + '/og-default.png',
  };
}

/**
 * Build BreadcrumbList JSON-LD for any page. Pass crumbs in order from root to
 * current page. The current page is the last crumb and uses its own URL.
 *
 * Example for a blog post:
 *   breadcrumbSchema([
 *     { name: 'Home', path: '/' },
 *     { name: 'Blog', path: '/blog' },
 *     { name: 'Study by Bloom\'s Level', path: '/blog/study-by-blooms-level' },
 *   ])
 */
export function breadcrumbSchema(crumbs: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: SITE + c.path,
    })),
  };
}

/** Convenience for blog-post breadcrumbs: Home → Blog → {post}. */
export function blogPostBreadcrumb(postKey: keyof typeof BLOG_POSTS) {
  const post = BLOG_POSTS[postKey];
  return breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title.replace(' · CipherExam', ''), path: post.canonical },
  ]);
}

/**
 * Pre-baked blog post metadata. Keep dates as YYYY-MM-DD.
 * Add entries here when new posts ship; the page component reads from this map.
 */
export const BLOG_POSTS: Record<
  string,
  {
    title: string;
    description: string;
    canonical: string;
    datePublished: string;
    dateModified?: string;
  }
> = {
  studyByBloomsLevel: {
    title: 'Study by Bloom’s Level — The Cognitive Framework · CipherExam',
    description:
      'The Bloom’s taxonomy framework that separates exam winners from flashcard losers. Worked examples for PMP, Security+, SHRM-CP.',
    canonical: '/blog/study-by-blooms-level',
    datePublished: '2026-05-12',
  },
  recallOnlyPrepFails: {
    title: 'Why Recall-Only Prep Fails High-Stakes Cert Exams · CipherExam',
    description:
      'Memorizing flashcards isn’t enough for exams that test judgment. A cognitive-science look at why recall-only prep fails — and what works instead.',
    canonical: '/blog/recall-only-prep-fails',
    datePublished: '2026-05-14',
  },
  cognitiveHeatmap: {
    title: 'Cognitive Heatmap — See Exactly Where You’re Weak · CipherExam',
    description:
      'How a per-domain, per-Bloom’s-level heatmap turns vague “I need to study more” into a specific weekly study plan.',
    canonical: '/blog/cognitive-heatmap',
    datePublished: '2026-06-02',
  },
  howExamsThink: {
    title: 'How Certification Exams Actually Think · CipherExam',
    description:
      'Cert exams aren’t random — they’re built around a small set of reasoning frameworks. Here’s how each major exam decides what’s right.',
    canonical: '/blog/how-certification-exams-think',
    datePublished: '2026-05-18',
  },
  whyConfusing: {
    title: 'Why Certification Exam Questions Are So Confusing · CipherExam',
    description:
      'Cert questions are written to test judgment, not recall. Here’s why "all four answers look right" is the design, not a bug.',
    canonical: '/blog/why-certification-exam-questions-are-so-confusing',
    datePublished: '2026-04-22',
  },
  fiveStudyMistakes: {
    title: '5 Study Mistakes That Cost You the Exam · CipherExam',
    description:
      'The five habits that quietly tank cert exam scores — and the small changes that fix them.',
    canonical: '/blog/5-study-mistakes-that-cost-your-certification-exam',
    datePublished: '2026-04-28',
  },
  howAiExplanations: {
    title: 'How AI Explanations Change the Way You Study · CipherExam',
    description:
      'Per-question AI explanations expose the reasoning pattern, not just the answer. Why that changes how you study for cert exams.',
    canonical: '/blog/how-ai-explanations-change-the-way-you-study',
    datePublished: '2026-05-04',
  },
  firstThirtyDays: {
    title: 'The First 30 Days of a Certification Study Plan · CipherExam',
    description:
      'A four-week study plan you can run for any major cert: diagnose weaknesses, build domain coverage, simulate, then close gaps.',
    canonical: '/blog/first-30-days-certification-study-plan',
    datePublished: '2026-05-08',
  },
};
