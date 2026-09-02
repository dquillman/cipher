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
      'AI-powered certification exam prep that explains the reasoning behind every question. Four certifications covered in depth: PMP, CompTIA Security+, Network+ and A+ Core 2. Free 14-day trial, no credit card.',
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
      'Free Starter forever, Pro at $19/month, or a one-time $59 Exam Pass for 90 days. 14-day free trial. No credit card required. Cancel anytime.',
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
            name: 'Exam Pass — 90 days',
            price: '59',
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
              text: 'Yes. CipherExam Pro includes a 14-day free trial. No credit card required to start.',
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
            name: "What's the money-back guarantee?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Use CipherExam Pro for up to 60 days. Not for you? Email support@cipherexam.com within 60 days of your first payment and we'll refund every dollar you've paid — no conditions, no proof of anything, no fine print.",
            },
          },
          {
            '@type': 'Question',
            name: 'Which certifications are included?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Four: PMP (built to PMI’s July 2026 Exam Content Outline), CompTIA Security+ (SY0-701), CompTIA Network+ (N10-009), and CompTIA A+ Core 2 (220-1202). All four are included at every paid tier.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is CipherExam different from other prep tools?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every question in all four banks is classified by Bloom’s Taxonomy, and every answer is explained through an exam-specific reasoning framework (Exam Lens). You learn how the exam thinks, not just the answer.',
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
      'Cognitive-science-backed cert prep writing. Bloom’s taxonomy, exam reasoning, and study strategies for PMP and the CompTIA certifications.',
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
      'Practice PMP exam questions with AI-explained reasoning. Bloom’s-classified, scenario-aware, with the PMI Decision Lens. Free 14-day trial.',
    canonical: '/lp/pmp',
    ogImage: 'https://cipherexam.com/og-pmp.png',
  },

  lpSecurityPlus: {
    title: 'CompTIA Security+ Practice — PBQ-Native · CipherExam',
    description:
      'Practice Security+ (SY0-701) with full PBQ support and reasoning explanations through the Security Triad Lens. Free 14-day trial.',
    canonical: '/lp/security-plus',
    ogImage: 'https://cipherexam.com/og-security-plus.png',
  },

  lpShrmCp: {
    title: 'SHRM-CP Practice — Competency-Lens Questions · CipherExam',
    description:
      'Practice SHRM-CP questions tied to the SHRM behavioral competencies, with AI-explained reasoning. Free 14-day trial.',
    canonical: '/lp/shrm-cp',
    ogImage: 'https://cipherexam.com/og-shrm-cp.png',
  },

  lpItil: {
    title: 'ITIL 4 Practice — Value-Chain-Lens Questions · CipherExam',
    description:
      'Practice ITIL 4 Foundation questions mapped to the service value chain and guiding principles, with AI-explained reasoning through the Exam Lens. Free 14-day trial.',
    canonical: '/lp/itil',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpNetworkPlus: {
    title: 'CompTIA Network+ Practice — OSI Troubleshooting · CipherExam',
    description:
      'Practice Network+ (N10-009) with layer-by-layer reasoning through the Exam Lens — locate the fault on the OSI model before you pick a fix. Bloom’s-classified questions. Free 14-day trial.',
    canonical: '/lp/network-plus',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpSixSigma: {
    title: 'Six Sigma Green Belt Practice — Exam Lens Explanations · CipherExam',
    description:
      "Practice Six Sigma Green Belt the way ASQ grades it. Every answer explained through the Exam Lens — which DMAIC phase — plus Bloom's-level reasoning. Free 14-day trial.",
    canonical: '/lp/six-sigma',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpCia: {
    title: 'CIA Part 1 Practice — AI-Explained Questions · CipherExam',
    description:
      "Practice CIA Part 1 (IIA) questions with AI-explained reasoning. Bloom's-classified, scenario-aware, graded against the IIA International Standards. Free 14-day trial.",
    canonical: '/lp/cia',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpCsm: {
    title: 'CSM Practice — AI-Explained Scrum Guide Questions · CipherExam',
    description:
      "Practice Certified ScrumMaster (CSM) questions explained through the Exam Lens, grounded in the current Scrum Guide. Bloom's-classified, scenario-aware. Free 14-day trial.",
    canonical: '/lp/csm',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpAPlusCore2: {
    title: 'CompTIA A+ Core 2 Practice — Order-First Troubleshooting · CipherExam',
    description:
      'Practice A+ Core 2 (220-1202) with reasoning explanations tied to the CompTIA six-step troubleshooting methodology — which step comes first, not just which fix is valid. Free 14-day trial.',
    canonical: '/lp/a-plus-core-2',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  lpPgmp: {
    title: 'PgMP Practice — Program-Level Reasoning · CipherExam',
    description:
      "Practice PgMP exam questions with AI-explained reasoning. Bloom's-classified, governance-aware, framed by program benefits realization. Free 14-day trial.",
    canonical: '/lp/pgmp',
    ogImage: 'https://cipherexam.com/og-default.png',
  },

  comparePocketPrep: {
    title: 'Pocket Prep Alternative — Reasoning-First Cert Prep · CipherExam',
    description:
      'Looking for a Pocket Prep alternative? CipherExam explains the reasoning behind every question — Bloom’s-classified, four certifications covered in depth, 60-day money-back guarantee. Free 14-day trial, no credit card.',
    canonical: '/compare/pocketprep-alternative',
    ogImage: 'https://cipherexam.com/og-default.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which certifications does CipherExam cover?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Four: PMP (aligned to PMI’s July 2026 Examination Content Outline), CompTIA Security+ (SY0-701), CompTIA Network+ (N10-009), and CompTIA A+ Core 2 (220-1202) — all in one subscription.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does CipherExam cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '$19/month for Pro, or a one-time $59 Exam Pass that covers one exam for 90 days and never renews. Every plan starts with a 14-day free trial — no credit card required — and both are covered by a 60-day, no-conditions money-back guarantee.',
          },
        },
      ],
    },
  },

  /**
   * FAQPage JSON-LD for /compare/best-pmp-exam-simulator-2026.
   * Two rules, because Google republishes this text verbatim:
   *  1. Every answer here must have a matching on-page counterpart in
   *     pages/compare/BestPmpSimulator2026.tsx. Edit both together.
   *  2. Exam facts come from PMI's July 2026 ECO; product facts come from code,
   *     not from config intent. In particular, config/exams.ts questionTypes
   *     for 6kECziMtR1BS3MpABLW5 declares eight formats, but that field has no
   *     consumers — the shipped simulator renders single-select only
   *     (components/simulator/QuestionCard.tsx). Do not claim otherwise here.
   */
  compareBestPmpSimulator2026: {
    title: 'Best PMP Exam Simulator for the 2026 Exam — Buyer’s Guide · CipherExam',
    description:
      'The PMP exam moved to a new Exam Content Outline in July 2026. What to look for in a simulator — full-length 180-question mocks, 2026-ECO domain weighting (33/41/26), honest coverage of the exam’s question formats — and how CipherExam meets each criterion. Free 14-day trial.',
    canonical: '/compare/best-pmp-exam-simulator-2026',
    ogImage: 'https://cipherexam.com/og-pmp.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Has the PMP exam already changed?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. PMI’s updated PMP exam, built against the July 2026 Examination Content Outline, is live and the previous outline is retired. The exam is still 180 questions (170 scored plus 10 unscored pretest items), but the allotted time changed to 240 minutes, up from the 230 minutes allowed under the retired outline, with two 10-minute breaks. The domains are reweighted to People 33%, Process 41%, Business Environment 26%.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is CipherExam ready for the 2026 PMP exam?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'On content, yes: PMP Exam v2026 is a first-class exam in CipherExam with its own question bank, written to the July 2026 outline and weighted 33/41/26 to match it, with full-length 180-question mocks on a 240-minute clock and an explanation on every item. On formats, no — not yet: that bank is single-answer multiple choice today, and the CipherExam simulator presents every item that way. It does not render case-study sets, graphic-based items, point-and-click, matching, or pull-down lists, and it does not reproduce the exam’s two 10-minute breaks.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will using a simulator guarantee I pass?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No tool can promise that. A good simulator removes the two most common failure modes — unfamiliar pacing and unfamiliar reasoning. The rest is your preparation.',
          },
        },
      ],
    },
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
  pmpExamChanges2026: {
    title: 'The PMP Exam Changed in July 2026 — Is Your Prep Current? · CipherExam',
    description:
      'PMI’s new Examination Content Outline went live in July 2026: still 180 questions, but now 240 minutes instead of 230, and reweighted to People 33% / Process 41% / Business Environment 26%. How to check whether your prep is current — and a bridge plan if you’re mid-prep.',
    canonical: '/blog/pmp-exam-changes-july-2026',
    datePublished: '2026-07-16',
    dateModified: '2026-08-08',
  },
  firstThirtyDays: {
    title: 'The First 30 Days of a Certification Study Plan · CipherExam',
    description:
      'A four-week study plan you can run for any major cert: diagnose weaknesses, build domain coverage, simulate, then close gaps.',
    canonical: '/blog/first-30-days-certification-study-plan',
    datePublished: '2026-05-08',
  },
};
