/**
 * Single source of truth for question formats across the app.
 * Do not redeclare this union elsewhere — import it from here
 * (types/Question.ts and hooks/useSimulator.ts both do).
 *
 * MEMBERSHIP RULE: a member may exist here only once Quiz.tsx can both RENDER
 * and SCORE it. The union is the contract Quiz.tsx switches on; anything added
 * without a renderer silently falls through to the single-select MCQ path and
 * is scored against `correctAnswer`, turning what should be a compile error
 * into a wrong grade. Add the renderer first, then the member.
 *
 * Currently implemented:
 *   'mcq'            → single-select multiple choice (Quiz.tsx default path)
 *   'emv'            → CipherExam expected-monetary-value calculation item
 *   'matching'       → drag-and-drop matching
 *   'pbq'            → CipherExam performance-based question
 *   'multi-response' → multi-select, all-or-nothing (utils/scoring.ts)
 * 'emv' and 'pbq' are CipherExam presentation formats, not PMI question types.
 *
 * Coverage of the EIGHT question types named in the PMP Examination Content
 * Outline (July 2026). A type stays out of the union until it has a renderer
 * AND a scorer — admitting one early turns a compile error into a silent
 * mis-grade, which is strictly worse than not supporting it:
 *   1. Case or Scenario (NEW; all modalities)      — TODO, needs shared-stimulus model
 *   2. Enhanced Matching (CBT only)                — TODO, needs image-drop renderer
 *   3. Graphic-Based (NEW; all modalities)         — TODO, needs exhibit renderer
 *   4. Multiple-Choice Single Response             — DONE as 'mcq'
 *   5. Multiple-Response (all modalities)          — DONE as 'multi-response'
 *   6. Point and Click / hotspot (CBT only)        — TODO, needs hotspot renderer
 *   7. Matching (CBT only)                         — DONE as 'matching'
 *   8. Pull-down List (CBT only)                   — TODO, needs dropdown renderer
 */
export type QuestionType = 'mcq' | 'emv' | 'matching' | 'pbq' | 'multi-response';

export type ExamConfig = {
    id: string;
    name: string;
    fullMock?: { questionCount: number; durationMinutes: number };
    /** Set when the certifying body has superseded the outline this bank is
     *  built against. The bank stays in EXAMS so existing selections, past
     *  attempts and live pass entitlements keep resolving to a name — but it
     *  must never be offered for sale. See SELLABLE_EXAMS. */
    retired?: boolean;
    /** The bank that replaces this one when its outline is superseded.
     *  Entitlements follow this chain, so a pass bought for an older bank keeps
     *  working after a cutover instead of silently expiring. See examLineage. */
    supersededBy?: string;
};

/** Retired 2021-outline PMP bank. Kept for historical references and for users
 *  who already have it selected; NOT the default any more. */
export const PMP_EXAM_ID = "7qmPagj9A6RpkC0CwGkY";
/** Live PMP bank, aligned to the July 2026 Examination Content Outline
 *  (People 33% / Process 41% / Business Environment 26%). */
export const PMP_2026_EXAM_ID = "6kECziMtR1BS3MpABLW5";
export const PGMP_EXAM_ID = "bF7IQUrKjbP2KLwiSNqt";

/** Every entry here is user-visible verbatim: Pricing.tsx renders
 *  `Object.values(EXAMS)` as the $59 Exam Pass purchase dropdown, and
 *  Account.tsx / PassExpiryBanner.tsx / Quiz.tsx look names up by entitlement
 *  id. So (a) insertion order is the order buyers see, live banks first, and
 *  (b) `name` is customer copy — do not encode internal lifecycle state
 *  ("retired", "deprecated", "v2 bank") in it. Removing a superseded bank is
 *  also not an option: existing pass holders' ids must keep resolving to a
 *  name. Filtering unsellable banks out of the purchase dropdown belongs in
 *  Pricing.tsx, not here. */
export const EXAMS: Record<string, ExamConfig> = {
    // LIVE: aligned to the PMP Examination Content Outline, July 2026, which
    // PMI cut over to on 9 July 2026 (People 33 / Process 41 / BE 26).
    // 180 questions (170 scored + 10 pretest) in 240 minutes — ECO p.17.
    "6kECziMtR1BS3MpABLW5": {
        id: "6kECziMtR1BS3MpABLW5",
        name: "PMP Exam v2026",
        fullMock: { questionCount: 180, durationMinutes: 240 },
    },
    // SUPERSEDED: built against the 2021 ECO (People 42 / Process 50 / BE 8);
    // the last exam on that outline was 8 July 2026. Its mock keeps the 2021
    // exam's own 230-minute clock — the July 2026 ECO's 240 minutes does not
    // describe this bank. Retained so existing selections, historical attempts
    // and pass entitlements keep resolving; no longer the default.
    "7qmPagj9A6RpkC0CwGkY": {
        id: "7qmPagj9A6RpkC0CwGkY",
        name: "PMP (PMI)",
        fullMock: { questionCount: 180, durationMinutes: 230 },
        retired: true,
        supersededBy: PMP_2026_EXAM_ID,
    },
    "IpECw0XAtBkgD1HyvYas": {
        id: "IpECw0XAtBkgD1HyvYas",
        name: "Certified ScrumMaster (CSM)",
        fullMock: { questionCount: 50, durationMinutes: 60 },
    },
    "bpfawZDj3qalhoU4mdd3": {
        id: "bpfawZDj3qalhoU4mdd3",
        name: "SHRM-CP",
        fullMock: { questionCount: 134, durationMinutes: 220 },
    },
    "XGfL6RE2ls7cokP2tqMa": {
        id: "XGfL6RE2ls7cokP2tqMa",
        name: "Six Sigma Green Belt (CSSGB)",
        fullMock: { questionCount: 110, durationMinutes: 258 },
    },
    "Vs3aNmifAJc9bYRFCxXc": {
        id: "Vs3aNmifAJc9bYRFCxXc",
        name: "Certified Payroll Professional (CPP)",
        fullMock: { questionCount: 190, durationMinutes: 240 },
    },
    "dtgTymjijqUr4NEIHbE1": {
        id: "dtgTymjijqUr4NEIHbE1",
        name: "CIA Part 1",
        fullMock: { questionCount: 125, durationMinutes: 150 },
    },
    "6FKeXlV2dzv4I03tewcU": {
        id: "6FKeXlV2dzv4I03tewcU",
        name: "ITIL 4 Foundation",
        fullMock: { questionCount: 40, durationMinutes: 60 },
    },
    "79cuGMNydTwDMhyiDjry": {
        id: "79cuGMNydTwDMhyiDjry",
        name: "CompTIA Security+ (SY0-701)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
    },
    // LIVE: 106 questions authored against the N10-009 objectives and weighted to
    // them (Concepts 23 / Implementation 20 / Operations 19 / Security 14 /
    // Troubleshooting 24, each within a point). Not a rename of the bank below —
    // a separate, re-authored bank with its own id, so retired-bank pass holders
    // carry forward through `supersededBy` rather than losing access.
    "N5mrEby0gKLFs1y88DpM": {
        id: "N5mrEby0gKLFs1y88DpM",
        name: "CompTIA Network+ (N10-009)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
    },
    // RETIRED: written against N10-008, which CompTIA replaced with N10-009 on
    // 20 June 2024 and stopped administering in December 2024. Retained so
    // existing selections, past attempts and live pass entitlements keep
    // resolving; superseded by the re-authored bank above.
    "gp6QwBz0FXFIntLSQSYr": {
        id: "gp6QwBz0FXFIntLSQSYr",
        name: "CompTIA Network+ (N10-008)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
        retired: true,
        supersededBy: "N5mrEby0gKLFs1y88DpM",
    },
    // LIVE: 161 questions authored against the 220-1202 (Core 2 V15) objectives.
    // Same pattern as Network+ — re-authored bank, new id, not a relabel.
    "12396VsKMFLnPMXivHKQ": {
        id: "12396VsKMFLnPMXivHKQ",
        name: "CompTIA A+ Core 2 (220-1202)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
    },
    // RETIRED: written against 220-1102 (Core 2 V14). CompTIA launched V15
    // (220-1202) on 25 March 2025 and stopped administering 220-1102 on
    // 25 September 2025.
    "cxBsVz8AVaocdEYbgSMA": {
        id: "cxBsVz8AVaocdEYbgSMA",
        name: "CompTIA A+ Core 2 (220-1102)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
        retired: true,
        supersededBy: "12396VsKMFLnPMXivHKQ",
    },
    "bF7IQUrKjbP2KLwiSNqt": {
        id: "bF7IQUrKjbP2KLwiSNqt",
        name: "PgMP (PMI)",
        fullMock: { questionCount: 170, durationMinutes: 240 },
    },
};

/** Exam-specific lens names for structured Coach Breakdown explanations.
 *  Keys are Firestore document IDs from the `exams` collection. */
export const EXAM_LENS: Record<string, { lensName: string; framework: string }> = {
    "7qmPagj9A6RpkC0CwGkY": { lensName: "PMI Decision Lens",              framework: "What would PMI want you to do?" },
    "6kECziMtR1BS3MpABLW5": { lensName: "PMI Decision Lens",              framework: "What would PMI want you to do?" },
    "IpECw0XAtBkgD1HyvYas": { lensName: "Scrum Guide Lens",              framework: "What does the Scrum Guide say the role should do?" },
    "bpfawZDj3qalhoU4mdd3": { lensName: "SHRM Competency Lens",          framework: "What aligns with SHRM behavioral competencies?" },
    "XGfL6RE2ls7cokP2tqMa": { lensName: "DMAIC Lens",                    framework: "Where does this fall in Define-Measure-Analyze-Improve-Control?" },
    "Vs3aNmifAJc9bYRFCxXc": { lensName: "Payroll Compliance Lens",        framework: "What does federal/state payroll law require?" },
    "dtgTymjijqUr4NEIHbE1": { lensName: "IIA Standards Lens",             framework: "What do the IIA Standards of Practice say?" },
    "6FKeXlV2dzv4I03tewcU": { lensName: "Service Value Lens",             framework: "How does this serve the ITIL service value chain?" },
    "79cuGMNydTwDMhyiDjry": { lensName: "Security Triad Lens",            framework: "CIA triad — which principle is being protected?" },
    "gp6QwBz0FXFIntLSQSYr": { lensName: "OSI Troubleshooting Lens",       framework: "What layer is this, and what's the systematic fix?" },
    "N5mrEby0gKLFs1y88DpM": { lensName: "OSI Troubleshooting Lens",       framework: "What layer is this, and what's the systematic fix?" },
    "cxBsVz8AVaocdEYbgSMA": { lensName: "Troubleshooting Methodology Lens", framework: "What step of the CompTIA troubleshooting model?" },
    "12396VsKMFLnPMXivHKQ": { lensName: "Troubleshooting Methodology Lens", framework: "What step of the CompTIA troubleshooting model?" },
    "bF7IQUrKjbP2KLwiSNqt": { lensName: "Program Governance Lens",          framework: "How does this serve the program's strategic objectives and benefits realization?" },
};

/** New users land on the live 2026-ECO PMP bank, not the retired 2021 one. */
export const DEFAULT_EXAM_ID = PMP_2026_EXAM_ID;

/** The four exams the site markets as "covered in depth" — the same four named
 *  on the landing page, in the meta description, and by the /lp/* pages. Only
 *  these appear in the exam picker (pages/ExamList.tsx).
 *
 *  This is deliberately NARROWER than SELLABLE_EXAMS. Sellable answers "may a
 *  pass be bought for this bank"; marketed answers "do we put this in front of
 *  someone choosing an exam". The seven omitted banks (CSM, SHRM-CP, Six Sigma,
 *  CPP, CIA Part 1, ITIL 4, PgMP) stay sellable and stay fully playable for
 *  anyone already on them — they are simply not advertised, because a bank that
 *  cannot fill a full-length mock should not be pitched to a new user.
 *
 *  Adding an exam here is a marketing claim. Before adding one, the landing
 *  page copy, meta description and the "Certification exams" stat all have to
 *  agree with it. */
export const MARKETED_EXAM_IDS: readonly string[] = [
    PMP_2026_EXAM_ID,              // PMP Exam v2026
    "79cuGMNydTwDMhyiDjry",        // CompTIA Security+ (SY0-701)
    "N5mrEby0gKLFs1y88DpM",        // CompTIA Network+ (N10-009)
    "12396VsKMFLnPMXivHKQ",        // CompTIA A+ Core 2 (220-1202)
];

/** True when the bank is one of the four advertised exams. */
export function isMarketedExam(examId: string | undefined): boolean {
    if (!examId) return false;
    return MARKETED_EXAM_IDS.includes(examId);
}

/** What the $59 Exam Pass dropdown offers: the marketed four, in the order
 *  declared above. Narrower than SELLABLE_EXAMS on purpose — we do not put an
 *  unadvertised bank in front of someone about to pay for it. Every id here is
 *  non-retired (enforced in exams.test.ts), so this is a subset of
 *  SELLABLE_EXAMS and needs no second retired check. */
export const PURCHASABLE_EXAMS: ExamConfig[] = MARKETED_EXAM_IDS.map((id) => EXAMS[id]);

/** Exams that may be offered for purchase. Anything flagged `retired` is
 *  excluded: selling a $59 Exam Pass for an outline the certifying body has
 *  already superseded is a refund waiting to happen. Retired banks stay in
 *  EXAMS so existing pass holders' IDs keep resolving to a name — they just
 *  cannot be bought again. Use this anywhere a user CHOOSES an exam to pay
 *  for; use EXAMS anywhere an existing ID is looked up. */
export const SELLABLE_EXAMS: ExamConfig[] = Object.values(EXAMS).filter(e => !e.retired);

/** True if `examId` is a bank we still sell. Retired banks return false. */
export function isSellableExam(examId: string | undefined): boolean {
    if (!examId) return false;
    return EXAMS[examId] ? !EXAMS[examId].retired : false;
}

/**
 * Every bank in the same certification lineage as `examId`, walking
 * `supersededBy` in both directions.
 *
 * This exists so entitlements survive a content-outline cutover. Someone who
 * bought a 90-day PMP pass in June 2026 bought "the PMP", not one particular
 * Firestore document — when PMI replaced the outline on 9 July their pass has
 * to keep working, and matching `pass.examId` by strict equality silently broke
 * it. Encoding the lineage means the next cutover is a one-line config change
 * instead of a data migration under time pressure.
 *
 * Returns `[examId]` for a bank with no lineage, so callers need no special case.
 */
export function examLineage(examId: string): string[] {
    const chain = new Set<string>([examId]);

    // Forward: this bank and everything that replaces it.
    let cursor: string | undefined = EXAMS[examId]?.supersededBy;
    while (cursor && !chain.has(cursor)) {
        chain.add(cursor);
        cursor = EXAMS[cursor]?.supersededBy;
    }

    // Backward: anything this bank replaces, transitively. Re-scanning until
    // stable handles a chain of three or more outlines regardless of key order.
    let grew = true;
    while (grew) {
        grew = false;
        for (const e of Object.values(EXAMS)) {
            if (e.supersededBy && chain.has(e.supersededBy) && !chain.has(e.id)) {
                chain.add(e.id);
                grew = true;
            }
        }
    }

    return [...chain];
}

export function isExam(examId: string | undefined, configId: string): boolean {
    if (!examId) return false;
    return examId === configId;
}
