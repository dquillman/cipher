import * as functions from 'firebase-functions';
import OpenAI from 'openai';

const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'dummy-key-for-deploy') {
        throw new Error("OPENAI_API_KEY is missing or invalid in environment secrets.");
    }
    return new OpenAI({ apiKey });
};

export const testOpenAIConnection = functions.https.onCall(async (data, context) => {
    // Optional: Restrict to admin or authenticated users
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to test connection.');
    }

    try {
        const client = getOpenAI();
        const start = Date.now();

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 1
        });

        const duration = Date.now() - start;

        return {
            success: true,
            latency: duration,
            message: "Connection successful!",
            model: response.model,
            usage: response.usage
        };
    } catch (error: any) {
        console.error("OpenAI Connection Test Failed:", error);
        throw new functions.https.HttpsError('internal', `Test Failed: ${error.message}`);
    }
});
