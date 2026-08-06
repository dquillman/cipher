import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { enforceRateLimit } from './rateLimit';
import { resolveOpenAIKey } from './openaiKey';

const getOpenAI = () => {
    // Resolves from functions.config() as well as the env var. Reading env only
    // made this diagnostic report a missing key while the tutor was working
    // fine off the config store — i.e. the health check was wrong, not the app.
    const apiKey = resolveOpenAIKey();
    if (!apiKey) {
        throw new Error('OpenAI key missing from both functions.config().openai.key and OPENAI_API_KEY.');
    }
    return new OpenAI({ apiKey });
};

async function requireAdmin(context: functions.https.CallableContext): Promise<void> {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const token = context.auth.token;
    if (token.admin === true || token.super_admin === true ||
        token.email === 'dquillman2112@gmail.com') {
        return;
    }

    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const role = userDoc.data()?.role;
    if (role !== 'admin' && role !== 'super-admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
    }
}

export const testOpenAIConnection = functions.https.onCall(async (_data, context) => {
    await requireAdmin(context);
    await enforceRateLimit('testOpenAIConnection', context, 20);

    try {
        const client = getOpenAI();
        const start = Date.now();
        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 1,
        });

        return {
            success: true,
            latency: Date.now() - start,
            message: 'Connection successful!',
            model: response.model,
            usage: response.usage,
        };
    } catch (error: unknown) {
        console.error('OpenAI Connection Test Failed:', error);
        throw new functions.https.HttpsError('internal', 'OpenAI connection test failed.');
    }
});
