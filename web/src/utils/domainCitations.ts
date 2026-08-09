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
    [PGMP_EXAM_ID]: "PMI PgMP® Examination Content Outline · The Standard for Program Management",
    "IpECw0XAtBkgD1HyvYas": "The Scrum Guide (2020) – Schwaber & Sutherland",
    "bpfawZDj3qalhoU4mdd3": "SHRM Body of Applied Skills & Knowledge (SHRM BASK)",
    "XGfL6RE2ls7cokP2tqMa": "ASQ Certified Six Sigma Green Belt Body of Knowledge",
    "Vs3aNmifAJc9bYRFCxXc": "APA Payroll Source – Certified Payroll Professional Study Guide",
    "dtgTymjijqUr4NEIHbE1": "IIA Global Internal Audit Standards (2025)",
    "6FKeXlV2dzv4I03tewcU": "ITIL 4 Foundation: ITIL 4 Edition (Axelos)",
    "79cuGMNydTwDMhyiDjry": "CompTIA Security+ SY0-701 Exam Objectives",
    "gp6QwBz0FXFIntLSQSYr": "CompTIA Network+ N10-008 Exam Objectives",
    "cxBsVz8AVaocdEYbgSMA": "CompTIA A+ 220-1102 (Core 2) Exam Objectives",
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
