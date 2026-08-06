"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOpenAIConnection = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const openai_1 = require("openai");
const rateLimit_1 = require("./rateLimit");
const openaiKey_1 = require("./openaiKey");
const getOpenAI = () => {
    // Resolves from functions.config() as well as the env var. Reading env only
    // made this diagnostic report a missing key while the tutor was working
    // fine off the config store — i.e. the health check was wrong, not the app.
    const apiKey = (0, openaiKey_1.resolveOpenAIKey)();
    if (!apiKey) {
        throw new Error('OpenAI key missing from both functions.config().openai.key and OPENAI_API_KEY.');
    }
    return new openai_1.default({ apiKey });
};
async function requireAdmin(context) {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const token = context.auth.token;
    if (token.admin === true || token.super_admin === true ||
        token.email === 'dquillman2112@gmail.com') {
        return;
    }
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const role = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'admin' && role !== 'super-admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
    }
}
exports.testOpenAIConnection = functions.https.onCall(async (_data, context) => {
    await requireAdmin(context);
    await (0, rateLimit_1.enforceRateLimit)('testOpenAIConnection', context, 20);
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
    }
    catch (error) {
        console.error('OpenAI Connection Test Failed:', error);
        throw new functions.https.HttpsError('internal', 'OpenAI connection test failed.');
    }
});
//# sourceMappingURL=diagnostics.js.map