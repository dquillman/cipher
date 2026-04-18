import * as admin from 'firebase-admin';
import * as functions from "firebase-functions";
import OpenAI from "openai";
import { requirePro } from './guards';


interface TutorPayload {
    questionStem: string;
    options: string[];
    correctAnswerIndex: number;
    userSelectedOptionIndex: number;
    correctRationale: string; // The existing curated explanation
    examDomain?: string; // e.g., "People", "Process", "Business Environment"
    examId?: string; // e.g., "pmp", "csm" — scopes pattern tracking per exam
    coachMode?: 'quick' | 'deep'; // Controls explanation depth
    lensName?: string; // e.g., "SHRM Competency Lens"
    lensFramework?: string; // e.g., "What aligns with SHRM behavioral competencies?"
}

// Init Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface PatternData {
    name: string;
    core_rule: string;
    trap_signals: string[];
    five_second_heuristic: string;
    domain_tags: string[];
}

interface TutorResponse {
    verdict: string;
    comparison: {
        optionIndex: number;
        text: string;
        explanation: string;
    }[];
    examLens: string;
    pattern?: PatternData; // New extracted field
}

// Helper to slugify pattern name for ID
const generatePatternId = (name: string): string => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Helper: Handle Pattern Persistence and Stats
const processPatternInteraction = async (userId: string, pattern: PatternData, isCorrect: boolean, examId?: string) => {
    if (!pattern || !pattern.name || !examId) return;

    const patternId = generatePatternId(pattern.name);
    const now = admin.firestore.Timestamp.now();

    const batch = db.batch();

    // 1. Global Pattern (Upsert/Merge)
    const patternRef = db.collection('patterns').doc(patternId);
    batch.set(patternRef, {
        pattern_id: patternId,
        name: pattern.name,
        core_rule: pattern.core_rule,
        trap_signals: pattern.trap_signals,
        five_second_heuristic: pattern.five_second_heuristic,
        domain_tags: pattern.domain_tags,
        updated_at: now
    }, { merge: true });

    // 2. User Pattern Stats — always exam-scoped
    const statsRef = db.collection('users').doc(userId).collection('examStats').doc(examId).collection('traps').doc(patternId);

    const currentStatsSnap = await statsRef.get();
    let stats = currentStatsSnap.data() || {
        times_seen: 0,
        times_missed: 0,
        mastery_score: 0,
        first_seen_at: now
    };

    // Update Counts
    stats.times_seen = (stats.times_seen || 0) + 1;
    if (!isCorrect) {
        stats.times_missed = (stats.times_missed || 0) + 1;
    }
    stats.last_seen_at = now;

    // Recalculate Mastery Score (0-100)
    // Logic: Start at 0. Correct answer +10. Incorrect -15.
    // Bonus: If seen > 3 times and accuracy > 80%, boost.
    // specific implementation: 
    let score = stats.mastery_score || 0;
    if (isCorrect) {
        score = Math.min(100, score + 10);
    } else {
        score = Math.max(0, score - 15);
    }

    stats.mastery_score = score;

    batch.set(statsRef, stats, { merge: true });

    await batch.commit();
    console.log(`Pattern processed: ${patternId} for user ${userId}`);
};

export const generateTutorBreakdown = functions.https.onCall(async (data: TutorPayload, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    await requirePro(context);

    // 0. Force Debug / Entry Logging
    console.log("generateTutorBreakdown invoked", {
        uid: context.auth.uid,
        data: data ? { ...data, questionStem: data.questionStem?.substring(0, 50) + "..." } : "MISSING"
    });

    const { questionStem, options, correctAnswerIndex, userSelectedOptionIndex, correctRationale, examDomain, examId, coachMode, lensName, lensFramework } = data;
    const userId = context.auth.uid;
    const isCorrect = userSelectedOptionIndex === correctAnswerIndex;
    const isDeep = coachMode === 'deep';

    // 1. Validation
    if (!questionStem || !options || !Array.isArray(options) || correctAnswerIndex === undefined || userSelectedOptionIndex === undefined) {
        console.error("Invalid Tutor Payload:", { questionStem: !!questionStem, optionsLen: options?.length });
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields or invalid options format.');
    }

    // 2. Security / Config Check & Logging
    // Determine explicitly where the key is coming from
    const configKey = functions.config().openai?.key;
    const envKey = process.env.OPENAI_API_KEY;
    const apiKey = configKey || envKey;

    console.log("OpenAI Key Status:", {
        present: !!apiKey,
        source: configKey ? "functions.config" : (envKey ? "process.env" : "MISSING")
    });

    if (!apiKey || apiKey === 'dummy-key-for-build' || apiKey === 'dummy-key-for-deploy') {
        console.error("Missing OPENAI configuration.");
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Tutor Service is not configured (Missing API Key).'
        );
    }

    const client = new OpenAI({ apiKey });

    // DEBUG: Force Log Everything - REMOVED for Production

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o", // Use high-quality model for reasoning
            messages: [
                {
                    role: "system",
                    content: isDeep
                        ? `You are a veteran CIPHER tutor.
You know exactly what matters and skip the rest.
Tone: Calm, Direct, Supportive.

GOAL:
1. Validate the user's logic briefly (e.g., "In the real world, you'd do X...").
2. Pivot to the "Exam Reality" immediately.
3. State the ONE key insight.
4. Provide a structured breakdown with the exam-specific lens.

CONSTRAINTS:
- No filler words ("It is important to note...", "Let me explain...").
- No textbook definitions.

OUTPUT FORMAT:
{
  "verdict": "string (The coaching response. Validation -> Pivot -> Insight.)",
  "comparison": [
    { "optionIndex": 0, "text": "Option text", "explanation": "Targeted 1-liner." }
  ],
  "examLens": "string — MUST use this EXACT structure with these section prefixes separated by double newlines:\\n\\n${lensName || 'Exam Lens'}: [1-2 sentence core insight framed by: ${lensFramework || 'the exam framework'}]\\n\\nWhy this conflicts: [Explain why the wrong answer seems right but violates the framework]\\n\\nPattern: [A reusable pattern or mental rule to remember]\\n\\nNote: [Optional extra context or edge case]",
  "pattern": {
      "name": "string (Short canonical name)",
      "core_rule": "string (1-sentence immutable rule)",
      "trap_signals": ["string"],
      "five_second_heuristic": "string (Fast elimination rule)",
      "domain_tags": ["string"]
  }
}

Use ONLY the provided rationale as the source of truth.

IMPORTANT: Return valid JSON. The examLens field must contain the section prefixes (${lensName || 'Exam Lens'}:, Why this conflicts:, Pattern:, Note:) separated by double newlines.
`
                        : `You are a veteran CIPHER tutor.
You know exactly what matters and skip the rest.
Tone: Calm, Direct, Supportive.

GOAL:
1. Validate the user's logic briefly (e.g., "In the real world, you'd do X...").
2. Pivot to the "Exam Reality" immediately.
3. State the ONE key insight.
4. End with a reusable "Mental Rule".

CONSTRAINTS:
- Be extremely concise.
- No filler words ("It is important to note...", "Let me explain...").
- No textbook definitions.
- Under 50 words for the main explanation if possible.

OUTPUT FORMAT:
{
  "verdict": "string (The coaching response. Validation -> Pivot -> Insight.)",
  "comparison": [
    { "optionIndex": 0, "text": "Option text", "explanation": "Targeted 1-liner." }
  ],
  "examLens": "string (The 'Mental Rule'. Short & punchy. e.g. 'Paperwork first, people second.')",
  "pattern": {
      "name": "string (Short canonical name)",
      "core_rule": "string (1-sentence immutable rule)",
      "trap_signals": ["string"],
      "five_second_heuristic": "string (Fast elimination rule)",
      "domain_tags": ["string"]
  }
}

Use ONLY the provided rationale as the source of truth.

IMPORTANT: Return valid JSON.
`
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        question: questionStem,
                        options: options,
                        correctAnswer: options[correctAnswerIndex],
                        userSelection: options[userSelectedOptionIndex],
                        domain: examDomain,
                        rationale: correctRationale
                    })
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3, // Low temperature for factual consistency
        });



        const content = response.choices[0].message.content;
        if (!content) {
            throw new functions.https.HttpsError('internal', 'AI returned empty response');
        }

        const result = JSON.parse(content) as TutorResponse;

        // Fire-and-forget pattern processing (don't block UI response)
        if (result.pattern) {
            processPatternInteraction(userId, result.pattern, isCorrect, examId).catch(err => {
                console.error("Failed to process pattern:", err);
            });
        }

        return result;

    } catch (error: any) {
        console.error("CRITICAL: Error generating tutor breakdown:", error);

        // FAIL SAFE FALLBACK - RETURN VALID STRUCTURE TO PREVENT 500 IN UI
        console.warn("Returning FALLBACK response to prevent UI crash.");

        return {
            verdict: "The Tutor Service is momentarily unreachable, but here is the core logic: " + (correctRationale || "Review the correct answer details."),
            comparison: options.map((opt, i) => ({
                optionIndex: i,
                text: opt,
                explanation: i === correctAnswerIndex ? "Correct Answer" : "Incorrect"
            })),
            examLens: "Focus on the key concepts in the rationale.",
            pattern: undefined
        } as TutorResponse;
    }
});

export const generateTutorDeepDive = functions.https.onCall(async (data: { context: TutorResponse, style: 'simple' | 'memory' }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    await requirePro(context);

    // Check for API key — must mirror generateTutorBreakdown's dual-source logic
    const configKey = functions.config().openai?.key;
    const envKey = process.env.OPENAI_API_KEY;
    const apiKey = configKey || envKey;

    if (!apiKey || apiKey === 'dummy-key-for-build' || apiKey === 'dummy-key-for-deploy') {
        throw new functions.https.HttpsError('failed-precondition', 'Tutor Service is not configured (Missing API Key).');
    }

    const { context: breakdown, style } = data;
    const client = new OpenAI({ apiKey });

    const promptMap = {
        'simple': `Explain the core concept behind this verdict to a 5-year-old. Use a simple analogy. Keep it under 3 sentences. Verdict to explain: "${breakdown.verdict}"`,
        'memory': `Create a catchy, rhyming memory hook or mnemonic to help remember the key lesson from this verdict. Verdict: "${breakdown.verdict}". Exam Lens: "${breakdown.examLens}"`
    };

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a creative teaching assistant." },
                { role: "user", content: promptMap[style] || promptMap['simple'] }
            ],
            max_tokens: 150,
            temperature: 0.7
        });

        return { content: response.choices[0].message.content };
    } catch (error) {
        console.error("Deep Dive Error:", error);
        throw new functions.https.HttpsError('internal', 'Failed to generate deep dive.');
    }
});

export const getWeakestPatterns = functions.https.onCall(async (data: any, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const userId = context.auth.uid;
    const examId: string | undefined = data?.examId;

    if (!examId) {
        return [];
    }

    try {
        // 1. Fetch User Stats — strictly exam-scoped
        const statsCollection = db.collection('users').doc(userId).collection('examStats').doc(examId).collection('traps');

        const statsVerifySnapshot = await statsCollection
            .orderBy('mastery_score', 'asc')
            .limit(20)
            .get();

        if (statsVerifySnapshot.empty) {
            return [];
        }

        const statsDocs = statsVerifySnapshot.docs.map(doc => ({
            pattern_id: doc.id,
            ...doc.data()
        })) as any[];

        // 2. In-Memory Sort for Tie-Breakers
        // Rules: 
        // 1) Mastery ASC (already done primarily, but good to ensure)
        // 2) Times Missed DESC (High pain point)
        // 3) Last Seen DESC (Recency bias)
        statsDocs.sort((a, b) => {
            if (a.mastery_score !== b.mastery_score) return a.mastery_score - b.mastery_score;
            if (a.times_missed !== b.times_missed) return b.times_missed - a.times_missed;
            return b.last_seen_at?.toMillis() - a.last_seen_at?.toMillis();
        });

        // 3. Take Top 5
        const topWeakest = statsDocs.slice(0, 5);
        if (topWeakest.length === 0) return [];

        // 4. Join with Global Patterns
        const patternIds = topWeakest.map(s => s.pattern_id);
        const refs = patternIds.map(id => db.collection('patterns').doc(id));
        const patternSnaps = await db.getAll(...refs);

        // 5. Merge and Format
        const result = topWeakest.map(stat => {
            const patternDoc = patternSnaps.find(p => p.id === stat.pattern_id);
            const patternData = patternDoc?.data() as PatternData | undefined;

            return {
                pattern_id: stat.pattern_id,
                pattern_name: patternData?.name || 'Unknown Pattern',
                core_rule: patternData?.core_rule || 'No rule available.',
                five_second_heuristic: patternData?.five_second_heuristic || '',
                mastery_score: stat.mastery_score || 0,
                times_seen: stat.times_seen || 0,
                times_missed: stat.times_missed || 0,
                // last_seen: stat.last_seen_at?.toDate().toISOString() // Optional, excluded for cleanliness per requirements
            };
        });

        return result;

    } catch (error) {
        console.error("Error fetching weakest patterns:", error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch patterns.');
    }
});

