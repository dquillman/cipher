"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSmartQuizReview = void 0;
const functions = require("firebase-functions");
const openai_1 = require("openai");
const guards_1 = require("./guards");
// Lazy init OpenAI (same pattern as tutor.ts)
let openai;
const getOpenAI = () => {
    var _a;
    if (!openai) {
        const apiKey = ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("OPENAI_API_KEY is not set in functions.config().openai.key or env vars.");
        }
        openai = new openai_1.default({
            apiKey: apiKey || "dummy-key-for-build",
        });
    }
    return openai;
};
exports.generateSmartQuizReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
    }
    await (0, guards_1.requirePro)(context);
    const { total, correct, percent, weakest_domain, thinking_traps } = data;
    if (total == null || correct == null || percent == null || !weakest_domain) {
        throw new functions.https.HttpsError("invalid-argument", "Required fields: total, correct, percent, weakest_domain.");
    }
    const trapsText = thinking_traps || "None detected";
    const systemPrompt = `You are an experienced, honest PMP exam tutor. Your job is to write a personalized tutor review after a user completes a Smart Practice Quiz. This review is shown in a modal, not saved, and must feel human, specific, and encouraging — never generic or robotic.

USER DATA:
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

REQUIRED STRUCTURE (USE THESE HEADERS):

Overall Read
Open with an honest assessment. If strong, acknowledge without hype. If weaker, normalize it as useful signal, not failure.

Where You Lost Ground
Name the weakest domain. Explain what PMI tests there: People means servant leadership, conflict, influence. Process means choosing the right framework. Business Environment means linking decisions to value and strategy. Warn about the most common mistake in that domain.

Pattern to Watch
If thinking traps are present, call out the pattern and explain how PMI exploits it. If empty, infer a likely mistake from the weakest domain. Focus on thinking errors, not knowledge gaps.

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
    }
    catch (error) {
        console.error("Error generating smart quiz review:", error);
        throw new functions.https.HttpsError("internal", `Failed to generate review: ${error.message}`);
    }
});
//# sourceMappingURL=generateSmartQuizReview.js.map