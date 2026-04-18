export type QuestionType = 'mcq' | 'emv' | 'matching' | 'pbq';

export type ExamConfig = {
    id: string;
    name: string;
    fullMock?: { questionCount: number; durationMinutes: number };
    /** Question types this exam supports. Defaults to ['mcq'] if not specified. */
    questionTypes: QuestionType[];
};

export const PMP_EXAM_ID = "7qmPagj9A6RpkC0CwGkY";
export const PGMP_EXAM_ID = "bF7IQUrKjbP2KLwiSNqt";

export const EXAMS: Record<string, ExamConfig> = {
    "7qmPagj9A6RpkC0CwGkY": {
        id: "7qmPagj9A6RpkC0CwGkY",
        name: "PMP (PMI)",
        fullMock: { questionCount: 180, durationMinutes: 230 },
        questionTypes: ['mcq', 'emv', 'matching'],
    },
    "IpECw0XAtBkgD1HyvYas": {
        id: "IpECw0XAtBkgD1HyvYas",
        name: "Certified ScrumMaster (CSM)",
        fullMock: { questionCount: 50, durationMinutes: 60 },
        questionTypes: ['mcq'],
    },
    "bpfawZDj3qalhoU4mdd3": {
        id: "bpfawZDj3qalhoU4mdd3",
        name: "SHRM-CP",
        fullMock: { questionCount: 134, durationMinutes: 220 },
        questionTypes: ['mcq'],
    },
    "XGfL6RE2ls7cokP2tqMa": {
        id: "XGfL6RE2ls7cokP2tqMa",
        name: "Six Sigma Green Belt (CSSGB)",
        fullMock: { questionCount: 110, durationMinutes: 258 },
        questionTypes: ['mcq'],
    },
    "Vs3aNmifAJc9bYRFCxXc": {
        id: "Vs3aNmifAJc9bYRFCxXc",
        name: "Certified Payroll Professional (CPP)",
        fullMock: { questionCount: 190, durationMinutes: 240 },
        questionTypes: ['mcq'],
    },
    "dtgTymjijqUr4NEIHbE1": {
        id: "dtgTymjijqUr4NEIHbE1",
        name: "CIA Part 1",
        fullMock: { questionCount: 125, durationMinutes: 150 },
        questionTypes: ['mcq'],
    },
    "6FKeXlV2dzv4I03tewcU": {
        id: "6FKeXlV2dzv4I03tewcU",
        name: "ITIL 4 Foundation",
        fullMock: { questionCount: 40, durationMinutes: 60 },
        questionTypes: ['mcq'],
    },
    "79cuGMNydTwDMhyiDjry": {
        id: "79cuGMNydTwDMhyiDjry",
        name: "CompTIA Security+ (SY0-701)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
        questionTypes: ['mcq', 'matching', 'pbq'],
    },
    "gp6QwBz0FXFIntLSQSYr": {
        id: "gp6QwBz0FXFIntLSQSYr",
        name: "CompTIA Network+ (N10-008)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
        questionTypes: ['mcq', 'matching', 'pbq'],
    },
    "cxBsVz8AVaocdEYbgSMA": {
        id: "cxBsVz8AVaocdEYbgSMA",
        name: "CompTIA A+ Core 2 (220-1102)",
        fullMock: { questionCount: 90, durationMinutes: 90 },
        questionTypes: ['mcq', 'matching', 'pbq'],
    },
    "bF7IQUrKjbP2KLwiSNqt": {
        id: "bF7IQUrKjbP2KLwiSNqt",
        name: "PgMP (PMI)",
        fullMock: { questionCount: 170, durationMinutes: 240 },
        questionTypes: ['mcq'],
    },
};

/** Exam-specific lens names for structured Coach Breakdown explanations.
 *  Keys are Firestore document IDs from the `exams` collection. */
export const EXAM_LENS: Record<string, { lensName: string; framework: string }> = {
    "7qmPagj9A6RpkC0CwGkY": { lensName: "PMI Decision Lens",              framework: "What would PMI want you to do?" },
    "IpECw0XAtBkgD1HyvYas": { lensName: "Scrum Guide Lens",              framework: "What does the Scrum Guide say the role should do?" },
    "bpfawZDj3qalhoU4mdd3": { lensName: "SHRM Competency Lens",          framework: "What aligns with SHRM behavioral competencies?" },
    "XGfL6RE2ls7cokP2tqMa": { lensName: "DMAIC Lens",                    framework: "Where does this fall in Define-Measure-Analyze-Improve-Control?" },
    "Vs3aNmifAJc9bYRFCxXc": { lensName: "Payroll Compliance Lens",        framework: "What does federal/state payroll law require?" },
    "dtgTymjijqUr4NEIHbE1": { lensName: "IIA Standards Lens",             framework: "What do the IIA Standards of Practice say?" },
    "6FKeXlV2dzv4I03tewcU": { lensName: "Service Value Lens",             framework: "How does this serve the ITIL service value chain?" },
    "79cuGMNydTwDMhyiDjry": { lensName: "Security Triad Lens",            framework: "CIA triad — which principle is being protected?" },
    "gp6QwBz0FXFIntLSQSYr": { lensName: "OSI Troubleshooting Lens",       framework: "What layer is this, and what's the systematic fix?" },
    "cxBsVz8AVaocdEYbgSMA": { lensName: "Troubleshooting Methodology Lens", framework: "What step of the CompTIA troubleshooting model?" },
    "bF7IQUrKjbP2KLwiSNqt": { lensName: "Program Governance Lens",          framework: "How does this serve the program's strategic objectives and benefits realization?" },
};

export const DEFAULT_EXAM_ID = PMP_EXAM_ID;

export function isExam(examId: string | undefined, configId: string): boolean {
    if (!examId) return false;
    return examId === configId;
}
