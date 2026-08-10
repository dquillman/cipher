/**
 * Citation sources for the "📘 Reference" footer under an explanation.
 *
 * IMPORTANT — citations are scoped by EXAM FIRST, then by domain.
 *
 * The previous shape exported a flat `DOMAIN_CITATIONS` keyed only by domain
 * name ("People" / "Process" / "Business Environment") with PMBOK® values.
 * Domain names are not unique across banks — Six Sigma, ITIL, SHRM and others
 * all have a domain literally called "Process" — so a flat lookup cited those
 * questions to the PMBOK® Guide. Never reintroduce an exam-agnostic map here.
 */

import { PMP_EXAM_ID, PMP_2026_EXAM_ID, PGMP_EXAM_ID } from '../config/exams';

/** Exam-level reference sources, keyed by Firestore exam document ID. */
export const EXAM_REFERENCES: Record<string, string> = {
    // Retired 2021-outline PMP bank. The last exam on that outline was
    // 8 July 2026; PMI cut over to the July 2026 ECO on 9 July 2026.
    [PMP_EXAM_ID]: "PMI PMP® Examination Content Outline – 2021 (retired 8 July 2026)",
    // Live PMP bank. The July 2026 ECO states the exam is built from the ECO
    // and calls out differences from the PMBOK® Guide, which it names without
    // an edition number — so the ECO itself is the citation, not a PMBOK edition.
    [PMP_2026_EXAM_ID]: "PMI PMP® Examination Content Outline – July 2026",
    [PGMP_EXAM_ID]: "PMI PgMP® Examination Content Outline – March 2024 · The Standard for Program Management, Fifth Edition",
    // Scrum Alliance builds the CSM from its own learning objectives; the Scrum
    // Guide is the underlying framework, not the exam blueprint. Cite both.
    "IpECw0XAtBkgD1HyvYas": "Scrum Alliance CSM Learning Objectives (Jan 2022) · The Scrum Guide (Nov 2020)",
    // Re-authored against the 2026 BASK on 2026-08-10 and uploaded, so this
    // citation is earned rather than asserted: the two questions that taught the
    // abolished Global Mindset competency were rewritten to Inclusive Mindset,
    // and 16 questions were added covering Inclusive Mindset and the AI content
    // the 2026 edition wove through HR practice (the bank previously had none).
    // Verified in production: Inclusive Mindset 0 -> 12 questions, AI 0 -> 6, and
    // every surviving "Global Mindset" mention now explains the merge or quotes
    // the BASK's own retained indicator rather than teaching it as current.
    "bpfawZDj3qalhoU4mdd3": "SHRM Body of Applied Skills & Knowledge (BASK) – 2026 edition (effective 1 May 2026)",
    "XGfL6RE2ls7cokP2tqMa": "ASQ Certified Six Sigma Green Belt Body of Knowledge – 2022 edition",
    // The Payroll Source is a study guide, not the blueprint. The blueprint is
    // the CPP Content Outline, and it is dated because payroll content turns
    // over annually with the tax year.
    "Vs3aNmifAJc9bYRFCxXc": "PayrollOrg CPP Content Outline – 2019 KSA (superseded 5 Sep 2026)",
    "dtgTymjijqUr4NEIHbE1": "IIA CIA Part 1 Expanded Test Specifications – 2025 syllabus · Global Internal Audit Standards (2025)",
    // Administered by PeopleCert, not Axelos. ITIL Foundation V5 launched
    // Feb 2026; ITIL 4 remains bookable until its 31 Dec 2027 sunset.
    "6FKeXlV2dzv4I03tewcU": "ITIL 4 Foundation syllabus v4.2.0 (PeopleCert, Mar 2025)",
    "79cuGMNydTwDMhyiDjry": "CompTIA Security+ SY0-701 Exam Objectives (launched Nov 2023; current)",
    "gp6QwBz0FXFIntLSQSYr": "CompTIA Network+ N10-008 Exam Objectives (retired Dec 2024; superseded by N10-009)",
    "N5mrEby0gKLFs1y88DpM": "CompTIA Network+ N10-009 Exam Objectives (launched Jun 2024; current)",
    "cxBsVz8AVaocdEYbgSMA": "CompTIA A+ 220-1102 Core 2 Exam Objectives (retired 25 Sep 2025; superseded by 220-1202)",
    "12396VsKMFLnPMXivHKQ": "CompTIA A+ 220-1202 Core 2 V15 Exam Objectives (launched Mar 2025; current)",
};

/**
 * Domain-level citations, keyed by exam ID and THEN by domain name. A domain
 * entry can only ever apply inside the exam it is nested under. Exams with no
 * entry here simply fall back to their `EXAM_REFERENCES` value.
 */
export const DOMAIN_CITATIONS_BY_EXAM: Record<string, Record<string, string>> = {
    // Retired 2021 outline (People 42% / Process 50% / Business Environment 8%).
    // PMBOK® 7 is retained here only as a secondary study anchor for the era of
    // that outline — it is not carried over to the 2026 bank.
    [PMP_EXAM_ID]: {
        "People": "PMI PMP® ECO – 2021 (retired) | Domain I: People · PMBOK® Guide – 7th Edition, Team Performance Domain",
        "Process": "PMI PMP® ECO – 2021 (retired) | Domain II: Process · PMBOK® Guide – 7th Edition, Planning & Tailoring Principles",
        "Business Environment": "PMI PMP® ECO – 2021 (retired) | Domain III: Business Environment · PMBOK® Guide – 7th Edition, Value Delivery System",
    },
    // Live July 2026 outline. Weightings are verbatim from the ECO's domain
    // table: People 33%, Process 41%, Business Environment 26%.
    [PMP_2026_EXAM_ID]: {
        "People": "PMI PMP® Examination Content Outline – July 2026 | Domain I: People (33%)",
        "Process": "PMI PMP® Examination Content Outline – July 2026 | Domain II: Process (41%)",
        "Business Environment": "PMI PMP® Examination Content Outline – July 2026 | Domain III: Business Environment (26%)",
    },
};

/**
 * Resolve the reference line for one question: most specific citation wins,
 * but a domain citation is only ever consulted inside its own exam.
 */
export function resolveCitation(examId: string | undefined, domain: string | undefined): string {
    if (examId) {
        const domainCitation = domain ? DOMAIN_CITATIONS_BY_EXAM[examId]?.[domain] : undefined;
        if (domainCitation) return domainCitation;
        const examCitation = EXAM_REFERENCES[examId];
        if (examCitation) return examCitation;
    }
    return "Exam Reference Guide";
}
