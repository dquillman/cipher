import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { enforceRateLimit } from './rateLimit';

const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'dummy-key-for-deploy') {
        throw new Error('OPENAI_API_KEY is missing or invalid in environment secrets.');
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
