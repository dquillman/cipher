import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { requirePro } from './guards';

// Lazy init OpenAI (same pattern as tutor.ts)
let openai: OpenAI;
const getOpenAI = () => {
    if (!openai) {
        const apiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("OPENAI_API_KEY is not set in functions.config().openai.key or env vars.");
        }
        openai = new OpenAI({
            apiKey: apiKey || "dummy-key-for-build",
        });
    }
    return openai;
};

interface SmartQuizReviewPayload {
    total: number;
    correct: number;
    percent: number;
    /**
     * The weakest domain label, exactly as it appears in that exam's own
     * `domains` array. This is NOT a fixed set: the client derives it from
     * `examDomains`, so Security+ sends "Threats, Vulnerabilities and
     * Mitigations", ITIL sends "Service Value System", PMP sends "People" /
     * "Process" / "Business Environment", and so on. Validated at runtime below.
     */
    weakest_domain: string;
    thinking_traps?: string;
    /**
     * Exam context. All optional so older clients keep working: when the client
     * does not send it we resolve the exam from the caller's most recent quiz
     * run, and if that also fails we fall back to an exam-neutral tutor persona
     * rather than pretending every user is sitting the PMP.
     * `lensName` / `lensFramework` mirror the contract generateTutorBreakdown
     * already uses (web/src/config/exams.ts -> EXAM_LENS).
     */
    examId?: string;
    examName?: string;
    lensName?: string;
    lensFramework?: string;
}

const asTrimmedString = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

interface ResolvedExamContext {
    examId: string;
    examName: string;
    lensName: string;
    lensFramework: string;
}

/**
 * Works out which exam this review is for.
 * Priority: explicit payload -> caller's most recent quiz run -> nothing.
 * Never throws; an unknown exam just means a neutral persona.
 */
const resolveExamContext = async (
    uid: string,
    data: SmartQuizReviewPayload
): Promise<ResolvedExamContext> => {
    let examId = asTrimmedString(data.examId);
    let examName = asTrimmedString(data.examName);
    const lensName = asTrimmedString(data.lensName);
    const lensFramework = asTrimmedString(data.lensFramework);

    try {
        const db = admin.firestore();

        // quizRuns/{uid}/runs/{runId} — the run for this quiz was just written
        // by the client, so the newest one is the exam being reviewed.
        if (!examId) {
            const recentRun = await db
                .collection("quizRuns")
                .doc(uid)
                .collection("runs")
                .orderBy("updatedAt", "desc")
                .limit(1)
                .get();
            if (!recentRun.empty) {
                examId = asTrimmedString(recentRun.docs[0].get("examId"));
            }
        }

        if (examId && !examName) {
            const examSnap = await db.collection("exams").doc(examId).get();
            if (examSnap.exists) {
                examName = asTrimmedString(examSnap.get("name"));
            }
        }
    } catch (err) {
        // Exam lookup is best-effort — a review with a neutral persona beats a
        // failed review.
        console.warn("generateSmartQuizReview: exam context lookup failed", err);
    }

    return { examId, examName, lensName, lensFramework };
};

/** True only for the PMP itself. "PgMP" and "CAPM" must not match. */
const isPmpExam = (examName: string): boolean =>
    /\bPMP\b/i.test(examName) || /project management professional/i.test(examName);

/**
 * PMP-only domain coaching, written against the domains and tasks in the live
 * PMP Examination Content Outline (People / Process / Business Environment).
 * Deliberately qualitative — no domain percentages — because both the current
 * and the prior PMP banks use these same three domain names and this prompt has
 * no way to tell which bank the user just sat.
 */
const PMP_DOMAIN_COACHING = `Name the weakest domain and explain what PMI actually tests there:
- People: building and keeping a shared vision, surfacing the real source of a conflict, leading and empowering the team, identifying and engaging stakeholders, aligning and managing their expectations, knowledge transfer, and communication/reporting strategy. Most common mistake: escalating or invoking authority before talking to the people involved and finding the root cause.
- Process: assessing the project and recommending the development approach (predictive, adaptive/agile, or hybrid), integrated planning, scope, value-based delivery, resources, procurement, finance, quality, schedule, evaluating status, and closure. Most common mistake: reaching for a favourite tool or technique before confirming which development approach and which plan or agreement the situation actually sits in.
- Business Environment: governance and success metrics, compliance, change control, removing impediments and resolving issues, risk, continuous improvement and lessons learned, supporting organizational change, and reacting to external business-environment shifts. Most common mistake: acting on a change or an impediment directly instead of routing it through the governance, compliance, or change-control step first.
Warn about the most common mistake for the domain you named.`;

export const generateSmartQuizReview = functions.https.onCall(async (data: SmartQuizReviewPayload, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
    }
    await requirePro(context);

    const { total, correct, percent, thinking_traps } = data;
    const weakest_domain = asTrimmedString(data.weakest_domain);

    if (total == null || correct == null || percent == null || !weakest_domain) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Required fields: total, correct, percent, weakest_domain."
        );
    }

    const trapsText = thinking_traps || "None detected";

    const { examName, lensName, lensFramework } = await resolveExamContext(context.auth.uid, data);

    const examLabel = examName || "";
    const persona = examLabel
        ? `You are an experienced, honest tutor for the ${examLabel} certification exam.`
        : `You are an experienced, honest certification exam tutor.`;
    const examLine = examLabel ? `- Exam: ${examLabel}` : `- Exam: not identified — stay exam-neutral`;

    const lensLine = lensName
        ? `\nFrame your coaching through the ${lensName}${lensFramework ? ` — ${lensFramework}` : ""}.`
        : "";

    const domainGuidance = isPmpExam(examLabel)
        ? PMP_DOMAIN_COACHING
        : `Name the weakest domain exactly as it is given above. Explain, in your own words and specific to ${examLabel || "this exam"}, what that domain covers and what the exam is really testing there. Warn about the most common mistake candidates make in it. Do not invent official-sounding domain definitions you are not sure of, and never reference PMI, the PMBOK Guide, or PMP domains unless this review is for the PMP exam.`;

    const systemPrompt = `${persona} Your job is to write a personalized tutor review after a user completes a Smart Practice Quiz. This review is shown in a modal, not saved, and must feel human, specific, and encouraging — never generic or robotic.${lensLine}

USER DATA:
${examLine}
- Total questions: ${total}
- Correct answers: ${correct}
- Accuracy percentage: ${percent}%
- Weakest domain: ${weakest_domain}
- Thinking traps: ${trapsText}

OUTPUT REQUIREMENTS:
- Write in clear sections with short headers.
- Use friendly but professional language.
- Be honest without being harsh.
- Sound like a real coach talking to one person.
- Under 250 words.
- Do not mention templates, prompts, stats tables, or internal logic.
- Do not save or reference past attempts.
- Do not repeat raw numbers unless they add meaning.
- Do not use bullet overload — this appears in a modal.
- Stay inside the scope of the exam named above. Never coach toward a different certification.

REQUIRED STRUCTURE (USE THESE HEADERS):

Overall Read
Open with an honest assessment. If strong, acknowledge without hype. If weaker, normalize it as useful signal, not failure.

Where You Lost Ground
${domainGuidance}

Pattern to Watch
If thinking traps are present, call out the pattern and explain how the exam exploits it. If empty, infer a likely mistake from the weakest domain. Focus on thinking errors, not knowledge gaps.

One Thing to Do Next
Give exactly ONE concrete, immediately usable action. No lists.

Final Word
One sentence of grounded encouragement. No cliches, no hype.

TONE: Calm. Direct. Supportive. Confident. No marketing language. No cheerleading.`;

    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate the coaching review now." },
            ],
        });

        const reviewText = (completion.choices[0].message.content || "").trim();
        return { reviewText };
    } catch (error: any) {
        console.error("Error generating smart quiz review:", error);
        throw new functions.https.HttpsError("internal", `Failed to generate review: ${error.message}`);
    }
});
