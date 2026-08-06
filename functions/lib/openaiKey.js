"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOpenAIKey = void 0;
const functions = require("firebase-functions");
/**
 * Single place that answers "where is the OpenAI key?".
 *
 * There are two stores and they had drifted apart:
 *   - functions.config().openai.key — the legacy Runtime Config, where the key
 *     actually lives today.
 *   - process.env.OPENAI_API_KEY — from functions/.env, currently empty.
 *
 * tutor.ts and generateSmartQuizReview.ts read both, so the AI tutor worked.
 * index.ts and diagnostics.ts read only the env var, so they silently fell back
 * to a literal 'dummy-key-for-deploy' and every call 401'd — question
 * generation, batch generation and marketing copy were all broken while the
 * tutor looked fine. That split is why "the AI works" and "the AI is broken"
 * were both true at the same time.
 *
 * Config is checked first to match the existing precedence in tutor.ts.
 *
 * NOTE: functions.config() is deprecated and the Runtime Config service shuts
 * down in March 2027 — deploys depending on it will fail. Putting the key in
 * functions/.env is the migration, and this resolver already prefers to keep
 * working either way once that happens.
 */
function resolveOpenAIKey() {
    var _a;
    let configKey;
    try {
        configKey = (_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key;
    }
    catch (_b) {
        // functions.config() throws when no runtime config is provisioned at all.
        configKey = undefined;
    }
    const key = configKey || process.env.OPENAI_API_KEY;
    if (!key || key === 'dummy-key-for-build' || key === 'dummy-key-for-deploy') {
        return null;
    }
    return key;
}
exports.resolveOpenAIKey = resolveOpenAIKey;
//# sourceMappingURL=openaiKey.js.map