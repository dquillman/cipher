import { collection, query, where, orderBy, limit, getDocs, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { BLOOM_LEVELS, type BloomLevel } from '../types/Bloom';

export interface BloomStatLine {
    level: BloomLevel;
    correct: number;
    total: number;
    score: number; // 0-100
}

/** One cell of the 2D (level × domain) grid. */
export interface BloomGridCell {
    correct: number;
    total: number;
    score: number; // 0-100; meaningful only when total > 0
}

/** Row-major grid: level → domain → cell */
export type BloomGrid = Record<BloomLevel, Record<string, BloomGridCell>>;

export interface BloomTrendResult {
    stats: BloomStatLine[];
    grid: BloomGrid;
    domains: string[];       // ordered list of domains present in user's data
    untagged: number;        // answers whose question had no bloomLevel
    totalAnswered: number;   // total answers considered
    uniqueQuestions: number; // distinct questions answered
}

const RUN_FETCH_LIMIT = 500;
const IN_CHUNK_SIZE = 30;

/**
 * Fetches completed quiz runs for user/exam and aggregates per-Bloom-level accuracy.
 * Joins answer records (answer.questionId, answer.isCorrect) against question docs
 * to read bloomLevel. Requests questions in `in` chunks of 30 to avoid N+1 reads.
 */
export async function fetchBloomTrend(
    userId: string,
    examId: string
): Promise<BloomTrendResult> {
    // 1. Fetch completed runs for this exam
    const runsRef = collection(db, 'quizRuns', userId, 'runs');
    let runs: any[] = [];
    try {
        const q = query(
            runsRef,
            where('examId', '==', examId),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc'),
            limit(RUN_FETCH_LIMIT)
        );
        const snap = await getDocs(q);
        runs = snap.docs.map(d => d.data());
    } catch {
        const fallbackQ = query(runsRef, where('status', '==', 'completed'), limit(RUN_FETCH_LIMIT));
        const snap = await getDocs(fallbackQ);
        runs = snap.docs.map(d => d.data()).filter((r: any) => r.examId === examId);
    }

    // 2. Walk all answers — keep per-answer correctness AND per-answer domain.
    // Use a Map<questionId, { correct, total, domain }> to dedupe per-question attempts.
    // Design choice: count every attempt (not just latest). Rationale: if user
    // gets Apply questions wrong repeatedly, the heatmap should reflect that volume.
    // Domain comes from the answer record itself (written at save time by Quiz.tsx).
    // If different attempts of the same question report different domains, last wins.
    const perQuestion = new Map<string, { correct: number; total: number; domain: string | null }>();
    for (const run of runs) {
        const answers: any[] = run.answers || [];
        for (const a of answers) {
            if (!a || a.selectedOption === undefined) continue;
            const qid: string = a.questionId;
            if (!qid) continue;
            const prev = perQuestion.get(qid) || { correct: 0, total: 0, domain: null };
            prev.total += 1;
            if (a.isCorrect) prev.correct += 1;
            if (a.domain && typeof a.domain === 'string') prev.domain = a.domain;
            perQuestion.set(qid, prev);
        }
    }

    const questionIds = Array.from(perQuestion.keys());
    if (questionIds.length === 0) {
        return {
            stats: BLOOM_LEVELS.map(level => ({ level, correct: 0, total: 0, score: 0 })),
            grid: emptyGrid(),
            domains: [],
            untagged: 0,
            totalAnswered: 0,
            uniqueQuestions: 0,
        };
    }

    // 3. Fetch bloomLevel for each question in chunks of 30
    const qBloom = new Map<string, BloomLevel | undefined>();
    for (let i = 0; i < questionIds.length; i += IN_CHUNK_SIZE) {
        const chunk = questionIds.slice(i, i + IN_CHUNK_SIZE);
        const qSnap = await getDocs(
            query(collection(db, 'questions'), where(documentId(), 'in', chunk))
        );
        qSnap.docs.forEach(doc => {
            const data = doc.data() as any;
            qBloom.set(doc.id, data.bloomLevel as BloomLevel | undefined);
        });
    }

    // 4. Aggregate per level AND per (level × domain)
    const agg: Record<BloomLevel, { correct: number; total: number }> = {
        Remember: { correct: 0, total: 0 },
        Understand: { correct: 0, total: 0 },
        Apply: { correct: 0, total: 0 },
        Analyze: { correct: 0, total: 0 },
        Evaluate: { correct: 0, total: 0 },
        Create: { correct: 0, total: 0 },
    };
    const grid = emptyGrid();
    const domainSet = new Set<string>();
    let untagged = 0;
    let totalAnswered = 0;

    for (const [qid, rec] of perQuestion) {
        totalAnswered += rec.total;
        const level = qBloom.get(qid);
        if (level && BLOOM_LEVELS.includes(level)) {
            agg[level].correct += rec.correct;
            agg[level].total += rec.total;

            if (rec.domain) {
                domainSet.add(rec.domain);
                const row = grid[level];
                const cell = row[rec.domain] || { correct: 0, total: 0, score: 0 };
                cell.correct += rec.correct;
                cell.total += rec.total;
                cell.score = cell.total > 0 ? Math.round((cell.correct / cell.total) * 100) : 0;
                row[rec.domain] = cell;
            }
        } else {
            untagged += rec.total;
        }
    }

    const stats: BloomStatLine[] = BLOOM_LEVELS.map(level => {
        const { correct, total } = agg[level];
        return {
            level,
            correct,
            total,
            score: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
    });

    return {
        stats,
        grid,
        domains: Array.from(domainSet).sort(),
        untagged,
        totalAnswered,
        uniqueQuestions: questionIds.length,
    };
}

function emptyGrid(): BloomGrid {
    const g = {} as BloomGrid;
    for (const level of BLOOM_LEVELS) g[level] = {};
    return g;
}
