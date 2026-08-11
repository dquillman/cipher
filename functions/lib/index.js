"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLead = exports.startTrial = exports.trackAnswerUsage = exports.validateQuizStart = exports.cleanupTimedOutSessions = exports.seedExamSources = exports.markSourceReviewed = exports.triggerExamUpdateCheck = exports.checkForExamUpdates = exports.getMarketingAnalytics = exports.generateMarketingCopyVariants = exports.generateMarketingCopy = exports.logVisitorEvent = exports.evaluateQuestionQuality = exports.analyzeExamHealth = exports.extendExamPass = exports.createPassCheckoutSession = exports.cancelSubscription = exports.getSubscriptionDetails = exports.stripeWebhook = exports.createPortalSession = exports.createCheckoutSession = exports.deleteUser = exports.resetExamProgress = exports.getGlobalStats = exports.getAdminUserList = exports.resetUserProgress = exports.deleteExamQuestions = exports.batchGenerateQuestions = exports.generateQuestions = exports.getAdaptiveQuestions = exports.createUserProfile = exports.unsubscribe = exports.sendLeadMagnetWelcome = exports.sendExamCountdownEmails = exports.scheduleOnboardingDrip = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const openai_1 = require("openai");
const guards_1 = require("./guards");
const rateLimit_1 = require("./rateLimit");
const pmpFormulas_1 = require("./pmpFormulas");
const openaiKey_1 = require("./openaiKey");
const examWatch_1 = require("./examWatch");
// Ticket 1.2 — Resend onboarding drip (Day 4-7). Fires on users/{uid} create.
var onboardingDrip_1 = require("./onboardingDrip");
Object.defineProperty(exports, "scheduleOnboardingDrip", { enumerable: true, get: function () { return onboardingDrip_1.scheduleOnboardingDrip; } });
// Exam countdown emails (D-14/7/3/1). Daily scheduled job at 14:00 UTC.
var examCountdown_1 = require("./examCountdown");
Object.defineProperty(exports, "sendExamCountdownEmails", { enumerable: true, get: function () { return examCountdown_1.sendExamCountdownEmails; } });
// Lead-magnet welcome sequence (Day 0/2/5). Fires on leadCaptures/{id} create.
var leadMagnetWelcome_1 = require("./leadMagnetWelcome");
Object.defineProperty(exports, "sendLeadMagnetWelcome", { enumerable: true, get: function () { return leadMagnetWelcome_1.sendLeadMagnetWelcome; } });
// CAN-SPAM one-click opt-out. Public GET, no auth by design — the link in the
// email footer is the entire mechanism. Served at /api/unsubscribe.
var unsubscribe_1 = require("./unsubscribe");
Object.defineProperty(exports, "unsubscribe", { enumerable: true, get: function () { return unsubscribe_1.unsubscribe; } });
console.log("Global Index Execution Started");
admin.initializeApp();
console.log("Admin Initialized");
const db = admin.firestore();
// ===== USER PROFILE CREATION =====
// Auto-create user profile on signup with default 'user' role
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
    try {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 14);
        // Use Set with Merge to prevent overwriting client-side writes (like trial data)
        // AND enforce trial defaults server-side to guarantee consistency
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            role: 'user',
            // Server-owned trial ledger. `plan: trial` prevents stale trials
            // from being mistaken for paid Pro access by backend guards.
            plan: 'trial',
            trial: true,
            trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
            trialEndsAt: admin.firestore.Timestamp.fromDate(endDate),
            trialLengthDays: 14,
            trialConsumed: true,
            access: 'trial',
            accessLevel: 'pro',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true }); // CRITICAL: Do not overwrite existing fields
        console.log(`Created/Merged profile for user ${user.uid} with guaranteed 14-day trial`);
    }
    catch (error) {
        console.error(`Failed to create profile for user ${user.uid}:`, error);
    }
});
// Lazy init OpenAI to prevent deploy-time crashes if the key is missing.
// Resolves from BOTH stores (see openaiKey.ts) — this file previously read
// process.env only, so with the key living in functions.config() it silently
// used 'dummy-key-for-deploy' and every completion 401'd.
let openai;
const getOpenAI = () => {
    if (!openai) {
        const key = (0, openaiKey_1.resolveOpenAIKey)();
        if (!key) {
            console.warn("OpenAI key missing from both functions.config().openai.key and OPENAI_API_KEY.");
        }
        openai = new openai_1.default({
            apiKey: key || 'dummy-key-for-deploy',
        });
    }
    return openai;
};
// Simple SM-2 implementation for MVP
const calculatePriority = (mastery) => {
    if (!mastery || mastery.total === 0)
        return 100; // High priority if never seen
    const accuracy = mastery.correct / mastery.total;
    if (accuracy < 0.6)
        return 80; // High priority if struggling
    if (accuracy < 0.8)
        return 50; // Medium priority
    return 10; // Low priority if mastered
};
// Helper to check if dates are within N days
const isRecent = (timestamp, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return timestamp.toDate() > cutoff;
};
exports.getAdaptiveQuestions = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const examId = data.examId || 'default-exam';
    const count = data.count || 10;
    try {
        // 1. Fetch Data Parallelly
        const [masteryDoc, questionsSnap, attemptsSnap] = await Promise.all([
            db.collection('userMastery').doc(`${userId}_${examId}`).get(),
            db.collection('questions').where('examId', '==', examId).limit(200).get(),
            db.collection('quizAttempts')
                .where('userId', '==', userId)
                .where('examId', '==', examId)
                .orderBy('timestamp', 'desc')
                .limit(100) // Scan last 100 attempts for history
                .get()
        ]);
        const masteryData = masteryDoc.exists ? ((_a = masteryDoc.data()) === null || _a === void 0 ? void 0 : _a.masteryData) || {} : {};
        const allQuestions = questionsSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Map attempts for quick lookup: questionId -> { isCorrect, timestamp }
        const attemptHistory = new Map();
        attemptsSnap.forEach(doc => {
            const att = doc.data();
            // We want the MOST RECENT attempt for each question, which is guaranteed by desc sort order if we only set if missing
            if (!attemptHistory.has(att.questionId)) {
                attemptHistory.set(att.questionId, {
                    isCorrect: att.isCorrect,
                    timestamp: att.timestamp
                });
            }
        });
        // 2. Group by Variant
        const variantGroups = {};
        const singles = [];
        allQuestions.forEach((q) => {
            if (q.variantGroupId) {
                if (!variantGroups[q.variantGroupId])
                    variantGroups[q.variantGroupId] = [];
                variantGroups[q.variantGroupId].push(q);
            }
            else {
                singles.push(q);
            }
        });
        const candidates = [...singles];
        // 3. Process Variants (Select 1 per group)
        Object.entries(variantGroups).forEach(([groupId, variants]) => {
            if (variants.length === 0)
                return;
            // Integrity Check: Warn if mixed domains
            const domains = new Set(variants.map(v => v.domain));
            if (domains.size > 1) {
                console.warn(`Integrity Warning: Variant Group ${groupId} has mixed domains: ${Array.from(domains).join(', ')}`);
            }
            const domain = variants[0].domain || 'General';
            const domainStats = masteryData[domain] || { correct: 0, total: 0 };
            const domainAccuracy = domainStats.total > 0 ? (domainStats.correct / domainStats.total) : 0;
            const isStruggling = domainAccuracy < 0.60;
            let selectedVariant = null;
            if (isStruggling) {
                // RULE 1: CONSISTENCY
                // Check if user has seen any of these variants before
                const lastSeenVariant = variants.find(v => attemptHistory.has(v.id));
                if (lastSeenVariant) {
                    // Have they mastered it? If yes, maybe rotate. If no (wrong or just seen), stick to it.
                    const history = attemptHistory.get(lastSeenVariant.id);
                    if (!history.isCorrect) {
                        selectedVariant = lastSeenVariant; // Keep showing until they get it right
                    }
                }
            }
            if (!selectedVariant) {
                // RULE 2: ANTI-MEMORIZATION / ROTATION
                // Filter out variants answered correctly in last 14 days
                const validVariants = variants.filter(v => {
                    const h = attemptHistory.get(v.id);
                    if (h && h.isCorrect && isRecent(h.timestamp, 14)) {
                        return false; // Suppress recently mastered
                    }
                    return true;
                });
                if (validVariants.length > 0) {
                    // Pick random from valid
                    selectedVariant = validVariants[Math.floor(Math.random() * validVariants.length)];
                }
                else {
                    // All variants mastered recently? Pick the one seen longest ago (or random)
                    selectedVariant = variants[Math.floor(Math.random() * variants.length)];
                }
            }
            if (selectedVariant)
                candidates.push(selectedVariant);
        });
        // 4. Score Candidates
        const scoredQuestions = candidates.map((q) => {
            const domain = q.domain || 'General';
            const domainMastery = masteryData[domain];
            const priority = calculatePriority(domainMastery);
            return Object.assign(Object.assign({}, q), { score: priority + Math.random() * 20 });
        });
        // 5. Sort and Return Top N
        scoredQuestions.sort((a, b) => b.score - a.score);
        return scoredQuestions.slice(0, count);
    }
    catch (error) {
        console.error("Error fetching adaptive questions:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch questions');
    }
});
const axios_1 = require("axios");
// Helper to upload image to Firebase Storage
const uploadImageToStorage = async (imageUrl, prefix) => {
    // Try to get default bucket
    let bucket;
    try {
        bucket = admin.storage().bucket();
        console.log("Using default bucket:", bucket.name);
    }
    catch (e) {
        console.warn("Default bucket not found, falling back to candidates.");
    }
    const bucketCandidates = [
        bucket === null || bucket === void 0 ? void 0 : bucket.name,
        "exam-coach-ai-platform.firebasestorage.app",
    ].filter(Boolean); // Remove null/undefined
    // Remove duplicates
    const uniqueBuckets = [...new Set(bucketCandidates)];
    for (const bucketName of uniqueBuckets) {
        try {
            console.log(`Attempting upload to bucket: ${bucketName}`);
            const targetBucket = admin.storage().bucket(bucketName);
            // Generate a unique token
            // Node 20+ has crypto
            const { randomUUID } = require('crypto');
            const token = randomUUID();
            const extension = 'png';
            const fileName = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
            const file = targetBucket.file(fileName);
            const response = await (0, axios_1.default)({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream'
            });
            await new Promise((resolve, reject) => {
                response.data.pipe(file.createWriteStream({
                    metadata: {
                        contentType: 'image/png',
                        metadata: {
                            firebaseStorageDownloadTokens: token // Add token for public access
                        }
                    }
                }))
                    .on('error', reject)
                    .on('finish', resolve);
            });
            // Construct the persistent download URL
            // This works even with Uniform Bucket Level Access (UBLA)
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
            console.log("Upload successful. Public URL:", publicUrl);
            return publicUrl;
        }
        catch (error) {
            console.error(`Error uploading image to bucket ${bucketName}:`, error.message);
            // Continue to next candidate
        }
    }
    console.error("All bucket candidates failed.");
    return null;
};
exports.generateQuestions = functions
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    await (0, guards_1.requirePro)(context);
    const topic = data.topic || "Project Management";
    // Increase cap to 50 per request, but warn about timeouts in UI if possible
    const count = Math.min(data.count || 5, 50);
    const difficulty = data.difficulty || "Medium";
    const existingStems = new Set(data.existingStems || []);
    let difficultyPrompt = `Difficulty: ${difficulty}.`;
    if (difficulty === 'Mixed' || count > 20) {
        difficultyPrompt = "Difficulty: Mixed distribution (approx 30% Easy, 40% Medium, 30% Hard).";
    }
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a senior PMP instructor and exam question author. Return ONLY a raw JSON array of objects. Do not include markdown formatting.\n\n${pmpFormulas_1.PMP_FORMULA_REFERENCE}`
                },
                {
                    role: "user",
                    content: `
                        Generate ${count} unique, high-quality PMP exam questions about "${topic}".
                        ${difficultyPrompt}

                        Each object must have:
                        - stem: The question text (scenario-based).
                        - options: Array of 4 strings (labeled A through D in the scenario context).
                        - correctAnswer: Index of the correct option (0-3).
                        - explanation: A structured explanation with the following labeled sections separated by double line breaks:
                          1. Begin with clear reasoning explaining why the correct answer is correct.
                          2. "PMI Decision Lens:" — identify the specific PMI principle, mindset, or framework being applied.
                          3. "Why this conflicts:" — explicitly analyze EACH incorrect option by name. For each distractor: state what the option suggests and explain precisely why it fails in this scenario. Do NOT use generic phrases like "skip foundational steps" or "address symptoms rather than root causes." Be concrete and scenario-specific.
                          4. "Pattern:" — provide a reusable heuristic for similar PMP questions.
                          The explanation must read like a senior PMP instructor reviewing a real exam scenario. Avoid generic filler language.
                        - domain: Must be exactly "${topic}".
                        - difficulty: "${difficulty === 'Mixed' ? 'Varies (Easy, Medium, or Hard)' : difficulty}". **IMPORTANT:** If Mixed, you MUST label each question as Easy, Medium, or Hard based on its actual complexity. Do NOT write "Mixed".
                        - visual_description: A short, vivid visual description of the scenario (e.g. "A construction site meeting in the rain", "A tense boardroom negotiation"). Max 15 words.

                        Ensure questions are NOT in this list of existing questions: ${JSON.stringify(Array.from(existingStems).slice(0, 50))}...
                    `
                }
            ],
            response_format: { type: "json_object" }
        });
        const text = completion.choices[0].message.content || "[]";
        // OpenAI json_object mode usually returns { "questions": [...] } or just the array if prompted well
        // We'll parse and handle both key-based or array-based returns
        let questions = [];
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                questions = parsed;
            }
            else if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            }
            else {
                // fallback if it returns a wrapper object with different key
                const key = Object.keys(parsed)[0];
                if (Array.isArray(parsed[key])) {
                    questions = parsed[key];
                }
            }
        }
        catch (e) {
            console.error("JSON parse error", e);
            questions = [];
        }
        // GENERATE IMAGES (DALL-E 2)
        // We do this in parallel to save time
        const questionsWithImages = await Promise.all(questions.map(async (q) => {
            var _a, _b;
            let imageUrl = null;
            if (q.visual_description) {
                try {
                    console.log(`Generating image for: "${q.visual_description}"`);
                    const imageResponse = await openai.images.generate({
                        model: "dall-e-2",
                        // Force photorealistic style
                        prompt: `Photorealistic 4k photo: ${q.visual_description}`,
                        n: 1,
                        size: "512x512"
                    });
                    const tempUrl = ((_b = (_a = imageResponse.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null;
                    console.log("OpenAI returned URL:", tempUrl ? "Yes" : "No");
                    if (tempUrl) {
                        try {
                            console.log("App Options:", JSON.stringify(admin.app().options));
                            const storageClient = admin.storage().bucket().storage;
                            const [buckets] = await storageClient.getBuckets();
                            console.log("Available buckets:", buckets.map((b) => b.name));
                        }
                        catch (listErr) {
                            console.error("Failed to list buckets:", listErr.message || listErr);
                        }
                        // Persist image to Firebase Storage so it doesn't expire
                        imageUrl = await uploadImageToStorage(tempUrl, 'question_images');
                        console.log("Upload result:", imageUrl);
                    }
                }
                catch (imgError) {
                    console.error("Image generation loop failed. Error details:", JSON.stringify(imgError, Object.getOwnPropertyNames(imgError), 2));
                }
            }
            return Object.assign(Object.assign({}, q), { imageUrl, domain: topic, source: "AI-OpenAI-GPT4o-DALL-E", createdAt: admin.firestore.Timestamp.now() });
        }));
        return questionsWithImages;
    }
    catch (error) {
        console.error("Error generating questions:", error);
        throw new functions.https.HttpsError('internal', `Failed to generate questions via AI: ${error.message}`);
    }
});
exports.batchGenerateQuestions = functions
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    await (0, guards_1.requirePro)(context);
    const examId = data.examId;
    const targetCount = Math.min(data.targetCount || 100, 100);
    if (!examId) {
        throw new functions.https.HttpsError('invalid-argument', 'examId is required');
    }
    try {
        // 1. Fetch Exam Details
        const examDoc = await db.collection('exams').doc(examId).get();
        if (!examDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Exam not found');
        }
        const examData = examDoc.data() || {};
        const examName = examData.name || "Exam";
        const examDescription = examData.description || "";
        const domains = examData.domains || [];
        const blueprint = examData.blueprint || [];
        // PMP detection: use higher-quality model and structured explanation prompt
        const isPMP = examId === '7qmPagj9A6RpkC0CwGkY' || examId.toLowerCase().startsWith('pmp') || examName.toLowerCase().includes('pmp');
        // 2. Determine Distribution
        let distribution = [];
        if (blueprint.length > 0) {
            // Use blueprint weights
            const totalWeight = blueprint.reduce((sum, item) => {
                const w = typeof item.weight === 'string'
                    ? parseFloat(item.weight.replace('%', ''))
                    : (Number(item.weight) || 0);
                return sum + (isNaN(w) ? 0 : w);
            }, 0);
            distribution = blueprint.map((item) => {
                const w = typeof item.weight === 'string'
                    ? parseFloat(item.weight.replace('%', ''))
                    : (Number(item.weight) || 0);
                const ratio = (isNaN(w) ? 0 : w) / (totalWeight || 1);
                return {
                    domain: item.domain,
                    subDomain: item.subDomain,
                    count: Math.max(1, Math.round(targetCount * ratio)),
                    difficulty: item.difficulty,
                    questionType: item.questionType,
                    reference: item.reference,
                    keywords: item.keywords
                };
            });
        }
        else {
            // Fallback: Deterministic/Even Distribution (More reliable than AI generation)
            console.log("No blueprint found. Distributing questions evenly across domains:", domains);
            if (domains && domains.length > 0) {
                const countPerDomain = Math.floor(targetCount / domains.length);
                let remainder = targetCount % domains.length;
                // Check requested difficulty from data payload
                const reqDifficulty = data.difficulty || 'Mixed';
                distribution = domains.map((d) => {
                    // Distribute remainder one by one
                    const extra = remainder > 0 ? 1 : 0;
                    if (remainder > 0)
                        remainder--;
                    return {
                        domain: d,
                        count: countPerDomain + extra,
                        difficulty: reqDifficulty === 'Mixed' ? undefined : reqDifficulty // If undefined, we can handle it in the prompt loop to ask for mix
                    };
                });
            }
            else {
                // Default if no domains exist
                distribution = [{ domain: "General", count: targetCount, difficulty: data.difficulty || 'Medium' }];
            }
        }
        console.log(`Generating ${targetCount} questions for ${examName} with distribution:`, distribution);
        // 2b. Fetch Existing Questions (to avoid duplicates)
        // We fetch only the stems to save bandwidth/memory
        const existingQuestionsSnap = await db.collection('questions')
            .where('examId', '==', examId)
            .select('stem')
            .get();
        const existingStems = new Set(existingQuestionsSnap.docs.map(d => d.data().stem));
        console.log(`Found ${existingStems.size} existing questions for duplication check.`);
        // 3. Generate Questions in Batches (Chunked & Sequential)
        // Break down large counts into chunks of 5 to avoid JSON syntax errors
        const CHUNK_SIZE = 5;
        const generationTasks = [];
        for (const item of distribution) {
            let remaining = item.count;
            while (remaining > 0) {
                const chunkCount = Math.min(remaining, CHUNK_SIZE);
                generationTasks.push(Object.assign(Object.assign({}, item), { count: chunkCount }));
                remaining -= chunkCount;
            }
        }
        const generatedQuestions = [];
        console.log(`Starting generation of ${generationTasks.length} chunks...`);
        for (const [index, item] of generationTasks.entries()) {
            // Get a random sample of existing stems to warn the AI against (context limit protection)
            const storedStemsArray = Array.from(existingStems);
            const randomSample = storedStemsArray.sort(() => 0.5 - Math.random()).slice(0, 30);
            try {
                const pmpExplanationInstruction = `- explanation: A structured explanation with the following labeled sections separated by double line breaks:
                                      1. Begin with clear reasoning explaining why the correct answer is correct.
                                      2. "PMI Decision Lens:" — identify the specific PMI principle, mindset, or framework being applied.
                                      3. "Why this conflicts:" — explicitly analyze EACH incorrect option by name. For each distractor: state what the option suggests and explain precisely why it fails in this scenario. Do NOT use generic phrases like "skip foundational steps" or "address symptoms rather than root causes." Be concrete and scenario-specific.
                                      4. "Pattern:" — provide a reusable heuristic for similar PMP questions.
                                      The explanation must read like a senior PMP instructor reviewing a real exam scenario. Avoid generic filler language.`;
                const defaultExplanationInstruction = `- explanation: Detailed explanation of why the answer is correct.`;
                const completion = await getOpenAI().chat.completions.create({
                    model: isPMP ? "gpt-4o" : "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: isPMP
                                ? `You are a senior PMP instructor and exam question author for the "${examName}". Description: ${examDescription}. Return a JSON object with a "questions" array.\n\n${pmpFormulas_1.PMP_FORMULA_REFERENCE}`
                                : `You are an expert exam question generator for the "${examName}". Description: ${examDescription}. Return a JSON object with a "questions" array.`
                        },
                        {
                            role: "user",
                            content: `
                                    Generate ${item.count} unique, high-quality multiple-choice questions.
                                    Domain: "${item.domain}"
                                    ${item.subDomain ? `Sub-Domain/Topic: "${item.subDomain}"` : ''}
                                    Difficulty Level: "${item.difficulty || 'Mixed (30% Easy, 40% Medium, 30% Hard)'}"
                                    ${item.questionType ? `Question Style: "${item.questionType}"` : ''}
                                    ${item.keywords ? `Focus Keywords: "${item.keywords}"` : ''}
                                    ${item.reference ? `Reference Source: "${item.reference}"` : ''}

                                    Each object in the "questions" array must have:
                                    - stem: The question text (scenario-based, professional tone).
                                    - options: Array of 4 strings${isPMP ? ' (labeled A through D in the scenario context)' : ''}.
                                    - correctAnswer: Index of the correct option (0-3).
                                    ${isPMP ? pmpExplanationInstruction : defaultExplanationInstruction}
                                    ${item.reference ? `- explanation should cite: "${item.reference}"` : ''}
                                    - domain: "${item.domain}"
                                    ${item.subDomain ? `- subDomain: "${item.subDomain}"` : ''}
                                    - difficulty: "${item.difficulty || 'Varies (Easy, Medium, or Hard)'}". **IMPORTANT:** If you are asked to mix difficulties, specificy 'Easy', 'Medium', or 'Hard' for each question. Do NOT label them 'Mixed'.
                                    - visual_description: A short, vivid visual description of the scenario (e.g. "A construction site meeting in the rain", "A tense boardroom negotiation"). Max 15 words.

                                    CRITICAL: Do NOT generate questions identical or very similar to these existing ones:
                                    ${JSON.stringify(randomSample)}

                                    Ensure questions are challenging and relevant to the exam description.
                                `
                        }
                    ],
                    response_format: { type: "json_object" }
                });
                const text = completion.choices[0].message.content || "{}";
                const parsed = JSON.parse(text);
                const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
                if (questions.length > 0) {
                    // Client-side dedup check
                    const uniqueNew = questions.filter((q) => !existingStems.has(q.stem));
                    // Generate Images in Parallel for this chunk
                    const questionsWithImages = await Promise.all(uniqueNew.map(async (q) => {
                        var _a, _b;
                        let imageUrl = null;
                        if (q.visual_description) {
                            try {
                                const imageResponse = await openai.images.generate({
                                    model: "dall-e-2",
                                    prompt: q.visual_description,
                                    n: 1,
                                    size: "256x256"
                                });
                                const tempUrl = ((_b = (_a = imageResponse.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null;
                                if (tempUrl) {
                                    // Persist image to Firebase Storage so it doesn't expire
                                    imageUrl = await uploadImageToStorage(tempUrl, 'question_images');
                                }
                            }
                            catch (imgError) {
                                console.error("Image generation failed for:", q.visual_description, imgError);
                                // Fail gracefully
                            }
                        }
                        // Enforce metadata
                        q.domain = item.domain;
                        if (item.subDomain)
                            q.subDomain = item.subDomain;
                        // Don't overwrite if AI provided a specific difficulty (for Mixed mode)
                        // But if item.difficulty is set (e.g. "Easy"), force it.
                        if (item.difficulty) {
                            q.difficulty = item.difficulty;
                        }
                        else {
                            // Fallback if AI forgot to set it, but prefer AI's value
                            q.difficulty = q.difficulty || 'Medium';
                        }
                        q.imageUrl = imageUrl;
                        q.source = "AI-OpenAI-GPT4o-DALL-E"; // Update source
                        // Randomize options
                        if (q.options && typeof q.correctAnswer === 'number') {
                            const correctOptionText = q.options[q.correctAnswer];
                            for (let i = q.options.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
                            }
                            q.correctAnswer = q.options.indexOf(correctOptionText);
                        }
                        return q;
                    }));
                    questionsWithImages.forEach((q) => {
                        generatedQuestions.push(q);
                        existingStems.add(q.stem);
                    });
                    console.log(`Chunk ${index + 1}/${generationTasks.length} generated ${questionsWithImages.length} questions`);
                }
            }
            catch (err) {
                console.error(`Error generating chunk ${index + 1} for ${item.domain}:`, err);
                // Continue to next chunk
            }
            if (index < generationTasks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        // 4. Save Generated Questions to Firestore (Batched)
        if (generatedQuestions.length > 0) {
            const BATCH_SIZE = 500;
            let batch = db.batch();
            let counter = 0;
            for (const q of generatedQuestions) {
                const docRef = db.collection('questions').doc();
                batch.set(docRef, Object.assign(Object.assign({}, q), { examId: examId, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
                counter++;
                if (counter === BATCH_SIZE) {
                    await batch.commit();
                    batch = db.batch();
                    counter = 0;
                }
            }
            if (counter > 0) {
                await batch.commit();
            }
        }
        // 5. Update Exam Question Count
        await db.collection('exams').doc(examId).update({
            questionCount: admin.firestore.FieldValue.increment(generatedQuestions.length)
        });
        return {
            success: true,
            count: generatedQuestions.length,
            message: `Successfully generated ${generatedQuestions.length} questions.`
        };
    }
    catch (error) {
        console.error("Error in batch generation:", error);
        throw new functions.https.HttpsError('internal', `Batch generation failed: ${error.message}`);
    }
});
exports.deleteExamQuestions = functions
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onCall(async (data, context) => {
    // Verify admin access
    await requireAdmin(context);
    const examId = data.examId;
    if (!examId) {
        throw new functions.https.HttpsError('invalid-argument', 'examId is required');
    }
    try {
        const BATCH_SIZE = 500;
        const collectionRef = db.collection('questions');
        const query = collectionRef.where('examId', '==', examId).limit(BATCH_SIZE);
        return new Promise((resolve, reject) => {
            deleteQueryBatch(db, query, resolve)
                .then(async () => {
                // Reset count
                await db.collection('exams').doc(examId).update({
                    questionCount: 0
                });
                resolve({ success: true, message: 'All questions deleted.' });
            })
                .catch(reject);
        });
    }
    catch (error) {
        console.error("Error deleting questions:", error);
        throw new functions.https.HttpsError('internal', `Delete failed: ${error.message}`);
    }
});
/**
 * Resets all progress for a specific user and exam.
 * Deletes:
 * 1. userMastery document
 * 2. quizAttempts (optional, but good for clean slate)
 */
exports.resetUserProgress = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const userId = context.auth.uid;
    const { examId } = data;
    if (!examId)
        throw new functions.https.HttpsError('invalid-argument', 'examId is required');
    try {
        // 1. Delete Mastery
        await db.collection('userMastery').doc(`${userId}_${examId}`).delete();
        // 2. Delete Attempts (Optional - might want to keep history?)
        // For now, keeping attempts but resetting mastery is safer.
        // If user wants FULL reset, we can delete attempts too.
        return { success: true, message: 'Progress reset.' };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// --- Admin Functions ---
// Helper function to verify admin role
async function requireAdmin(context) {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const profileDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!profileDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User profile not found');
    }
    const role = (_a = profileDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'admin') {
        console.warn(`Admin access denied for user ${context.auth.uid} (${context.auth.token.email}) with role: ${role}`);
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
}
exports.getAdminUserList = functions.https.onCall(async (data, context) => {
    // Verify admin access
    await requireAdmin(context);
    try {
        const listUsersResult = await admin.auth().listUsers(1000); // Limit 1000 for MVP
        const users = listUsersResult.users;
        // Fetch Firestore profiles (to see Pro status)
        const profilesSnap = await db.collection('users').get();
        const profilesMap = new Map();
        profilesSnap.forEach(doc => {
            profilesMap.set(doc.id, doc.data());
        });
        // Merge Data
        const mergedUsers = users.map(user => {
            const profile = profilesMap.get(user.uid);
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
                isPro: (profile === null || profile === void 0 ? void 0 : profile.isPro) || false,
                plan: profile === null || profile === void 0 ? void 0 : profile.plan,
                stripeCustomerId: profile === null || profile === void 0 ? void 0 : profile.stripeCustomerId,
                subscriptionStatus: profile === null || profile === void 0 ? void 0 : profile.subscriptionStatus,
                trial: profile === null || profile === void 0 ? void 0 : profile.trial,
                trialEndsAt: profile === null || profile === void 0 ? void 0 : profile.trialEndsAt,
                trialStartedAt: profile === null || profile === void 0 ? void 0 : profile.trialStartedAt,
                access: profile === null || profile === void 0 ? void 0 : profile.access,
                testerOverride: profile === null || profile === void 0 ? void 0 : profile.testerOverride,
                testerExpiresAt: profile === null || profile === void 0 ? void 0 : profile.testerExpiresAt,
                role: (profile === null || profile === void 0 ? void 0 : profile.role) || 'user',
                archived: (profile === null || profile === void 0 ? void 0 : profile.archived) || false
            };
        });
        // Sort by Creation Time (Newest First)
        mergedUsers.sort((a, b) => {
            const timeA = new Date(a.creationTime).getTime();
            const timeB = new Date(b.creationTime).getTime();
            return timeB - timeA;
        });
        return { users: mergedUsers };
    }
    catch (error) {
        console.error("Error fetching users:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.getGlobalStats = functions.https.onCall(async (data, context) => {
    // Verify admin access
    await requireAdmin(context);
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        // 1. Quiz Activity (Last 30 Days)
        // Note: In high traffic, don't query collection directly. Use aggregated counters. 
        // For MVP, querying is okay.
        const attemptsSnap = await db.collection('quizAttempts')
            .where('timestamp', '>=', thirtyDaysAgo)
            .get();
        const activityByDate = {};
        attemptsSnap.forEach(doc => {
            const date = doc.data().timestamp.toDate().toISOString().split('T')[0];
            activityByDate[date] = (activityByDate[date] || 0) + 1;
        });
        const activityGraph = Object.entries(activityByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return {
            activityGraph
        };
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * Resets all progress for a specific user and exam.
 * Deletes:
 * 1. userMastery document
 * 2. All quizAttempts for that exam
 */
exports.resetExamProgress = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const examId = data.examId;
    if (!examId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an "examId".');
    }
    try {
        const batch = db.batch();
        // 1. Delete userMastery document
        const masteryRef = db.collection('userMastery').doc(`${userId}_${examId}`);
        batch.delete(masteryRef);
        // 2. Query and delete all relevant quizAttempts
        // Note: Batch limit is 500. If user has > 500 attempts, this might need chunking.
        const attemptsQuery = db.collection('quizAttempts')
            .where('userId', '==', userId)
            .where('examId', '==', examId);
        const attemptsSnap = await attemptsQuery.get();
        attemptsSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 3. Delete Question Progress (The Rings!)
        const progressQuery = db.collection('users').doc(userId).collection('questionProgress')
            .where('examId', '==', examId);
        const progressSnap = await progressQuery.get();
        progressSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        // 4. Delete quizRuns (separate batch due to subcollection structure)
        // This is the NEW data source for Stats/Analytics
        const runsQuery = db.collection('quizRuns').doc(userId).collection('runs')
            .where('examId', '==', examId);
        const runsSnap = await runsQuery.get();
        if (runsSnap.size > 0) {
            const runsBatch = db.batch();
            runsSnap.docs.forEach((doc) => {
                runsBatch.delete(doc.ref);
            });
            await runsBatch.commit();
        }
        // 5. Delete study plan documents for this exam
        const plansQuery = db.collection('study_plans')
            .where('userId', '==', userId)
            .where('examId', '==', examId);
        const plansSnap = await plansQuery.get();
        if (plansSnap.size > 0) {
            const plansBatch = db.batch();
            plansSnap.docs.forEach((doc) => {
                plansBatch.delete(doc.ref);
            });
            await plansBatch.commit();
        }
        return { success: true, count: attemptsSnap.size + runsSnap.size + plansSnap.size };
    }
    catch (error) {
        console.error("Error resetting progress:", error);
        throw new functions.https.HttpsError('internal', `Failed to reset progress: ${error.message}`);
    }
});
/**
 * Deletes a user from Firebase Authentication and Firestore.
 * Removes all related data including quiz attempts, mastery records, etc.
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
    // Verify admin access
    await requireAdmin(context);
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
    }
    // Prevent self-deletion
    if (context.auth.uid === uid) {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot delete your own account.');
    }
    try {
        // 1. Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);
        // 2. Delete user document from Firestore
        await db.collection('users').doc(uid).delete();
        // 3. Delete quiz attempts
        const attemptsQuery = db.collection('quizAttempts').where('userId', '==', uid);
        const attemptsSnap = await attemptsQuery.get();
        const batch1 = db.batch();
        attemptsSnap.docs.forEach(doc => {
            batch1.delete(doc.ref);
        });
        await batch1.commit();
        // 4. Delete user mastery records (format: userId_examId)
        const masteryQuery = db.collection('userMastery');
        const masterySnap = await masteryQuery.get();
        const batch2 = db.batch();
        masterySnap.docs.forEach(doc => {
            if (doc.id.startsWith(`${uid}_`)) {
                batch2.delete(doc.ref);
            }
        });
        await batch2.commit();
        // 5. Delete question progress subcollection
        const progressQuery = db.collection('users').doc(uid).collection('questionProgress');
        const progressSnap = await progressQuery.get();
        const batch3 = db.batch();
        progressSnap.docs.forEach(doc => {
            batch3.delete(doc.ref);
        });
        await batch3.commit();
        return {
            success: true,
            message: `User ${uid} and all related data deleted successfully.`,
            deletedRecords: {
                quizAttempts: attemptsSnap.size,
                masteryRecords: masterySnap.docs.filter(doc => doc.id.startsWith(`${uid}_`)).length,
                questionProgress: progressSnap.size
            }
        };
    }
    catch (error) {
        console.error("Error deleting user:", error);
        throw new functions.https.HttpsError('internal', `Failed to delete user: ${error.message}`);
    }
});
var stripe_1 = require("./stripe");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return stripe_1.createCheckoutSession; } });
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return stripe_1.createPortalSession; } });
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripe_1.stripeWebhook; } });
Object.defineProperty(exports, "getSubscriptionDetails", { enumerable: true, get: function () { return stripe_1.getSubscriptionDetails; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return stripe_1.cancelSubscription; } });
var examPass_1 = require("./examPass"); // 90-day Exam Pass (docs/exam-pass-spec.md)
Object.defineProperty(exports, "createPassCheckoutSession", { enumerable: true, get: function () { return examPass_1.createPassCheckoutSession; } });
Object.defineProperty(exports, "extendExamPass", { enumerable: true, get: function () { return examPass_1.extendExamPass; } });
var analytics_1 = require("./analytics");
Object.defineProperty(exports, "analyzeExamHealth", { enumerable: true, get: function () { return analytics_1.analyzeExamHealth; } });
var quality_1 = require("./quality"); // Phase 2
Object.defineProperty(exports, "evaluateQuestionQuality", { enumerable: true, get: function () { return quality_1.evaluateQuestionQuality; } });
async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    // Recurse on the next process tick, to avoid
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}
// --- Marketing Functions ---
exports.logVisitorEvent = functions.https.onCall(async (data, context) => {
    // Publicly callable — per-IP daily cap stops scripted counter inflation.
    await (0, rateLimit_1.enforceRateLimit)('logVisitorEvent', context, 200);
    // Sanitize: `source` becomes part of a Firestore field path below, so an
    // arbitrary string could inject nested fields or make the write throw.
    const rawSource = typeof (data === null || data === void 0 ? void 0 : data.source) === 'string' ? data.source : 'direct';
    const source = /^[a-zA-Z0-9_-]{1,40}$/.test(rawSource) ? rawSource : 'other';
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dailyStats').doc(today);
    try {
        await statsRef.set({
            date: today,
            visitors: admin.firestore.FieldValue.increment(1),
            [`sources.${source}`]: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        console.error("Error logging visitor:", error);
        return { success: false };
    }
});
exports.generateMarketingCopy = functions.https.onCall(async (data, context) => {
    // Internal marketing tool — admin only. Any signed-up user being able to
    // burn GPT-4o tokens here was an open cost hole.
    await requireAdmin(context);
    const { topic, tone, platform } = data;
    if (!topic || !platform) {
        throw new functions.https.HttpsError('invalid-argument', 'Topic and Platform are required.');
    }
    try {
        const prompt = `
        Act as an expert digital marketer for "CIPHER" (an app helping people pass PMP/Certification exams).
        
        Write a ${platform} post about: "${topic}".
        Tone: ${tone || 'Professional'}.
        
        Requirements:
        - Use engaging hooks.
        - Include relevant hashtags if applicable to the platform.
        - Encourage users to try the app.
        - Keep it concise and optimized for ${platform}.
        `;
        const completion = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a world-class marketing copywriter." },
                { role: "user", content: prompt }
            ],
        });
        const copy = completion.choices[0].message.content || "";
        return { copy };
    }
    catch (error) {
        console.error("Error generating marketing copy:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.generateMarketingCopyVariants = functions.https.onCall(async (data, context) => {
    // Internal marketing tool — admin only (see generateMarketingCopy).
    await requireAdmin(context);
    // Optional context from current inputs
    const { currentPrimary, currentSecondary } = data;
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant. Return a JSON object with a "variants" array. Each item should have "primary" and "secondary" fields.`
                },
                {
                    role: "user",
                    content: `
                    You are helping write marketing copy for a calm, trust-based exam preparation product.
                    Audience: Anxious PMP candidates.
                    Tone: Calm, confident, non-salesy, non-hype.
                    Goal: Explain value without exaggeration.

                    Generate 5 alternative versions of:
                    1) A single-sentence primary value statement
                    2) A single-sentence supporting line

                    Rules:
                    - No buzzwords
                    - No guarantees
                    - No urgency language
                    - No exclamation points
                    - Focus on thinking patterns, clarity, and confidence
                    - Avoid phrases like 'AI-powered', 'revolutionary', or 'crush the exam'

                    ${currentPrimary ? `Context (Current Primary): "${currentPrimary}"` : ''}
                    ${currentSecondary ? `Context (Current Secondary): "${currentSecondary}"` : ''}

                    Return valid JSON only.
                    `
                }
            ],
            response_format: { type: "json_object" }
        });
        const text = completion.choices[0].message.content || "{}";
        const parsed = JSON.parse(text);
        // Validation/Sanitization
        const variants = (Array.isArray(parsed.variants) ? parsed.variants : []).map((v) => ({
            primary: v.primary || "",
            secondary: v.secondary || ""
        }));
        return { variants };
    }
    catch (error) {
        console.error("Error generating variants:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.getMarketingAnalytics = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    try {
        const today = new Date();
        const stats = [];
        // Fetch Real Data Collections
        const usersSnap = await db.collection('users').get();
        const attemptsSnap = await db.collection('quizAttempts').get();
        const dailyStatsSnap = await db.collection('dailyStats').orderBy('date', 'desc').limit(30).get();
        const dailyStatsMap = new Map();
        dailyStatsSnap.docs.forEach(doc => {
            dailyStatsMap.set(doc.id, doc.data());
        });
        // Helper to check date
        const isSameDate = (d1, d2) => d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
        // Generate last 30 days
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            // 1. Visitors & Sources (Real from dailyStats)
            const dayStats = dailyStatsMap.get(dateStr) || { visitors: 0, sources: {} };
            const visitors = dayStats.visitors || 0;
            const sources = {
                organic: ((_a = dayStats.sources) === null || _a === void 0 ? void 0 : _a.organic) || 0,
                social: ((_b = dayStats.sources) === null || _b === void 0 ? void 0 : _b.social) || 0,
                direct: ((_c = dayStats.sources) === null || _c === void 0 ? void 0 : _c.direct) || 0,
                ads: ((_d = dayStats.sources) === null || _d === void 0 ? void 0 : _d.ads) || 0
            };
            // 2. Signups (Real)
            const signups = usersSnap.docs.filter(doc => {
                var _a;
                const created = ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(doc.data().creationTime || 0);
                return isSameDate(created, d);
            }).length;
            // 3. Activations (Real - First Quiz Attempt)
            // Ideally we check if it was their *first* attempt, but for MVP we'll just count unique active users that day
            const activeUsers = new Set();
            attemptsSnap.docs.forEach(doc => {
                if (isSameDate(doc.data().timestamp.toDate(), d)) {
                    activeUsers.add(doc.data().userId);
                }
            });
            const activations = activeUsers.size;
            // 4. Upgrades (Real - Payment records)
            // NOTE: Assuming there's a 'payments' collection or looking at users with subscriptionStatus === 'active'
            // For now, we'll estimate based on users table 'subscriptionStatus' change date if available, 
            // OR just hardcode 0 if no payment history collection is available to context.
            // Let's look for users created on this day who match 'pmp_pro'
            const upgrades = usersSnap.docs.filter(doc => {
                var _a;
                const created = ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(doc.data().creationTime || 0);
                return isSameDate(created, d) && doc.data().subscriptionStatus === 'active';
            }).length; // This is a rough proxy: "New Users who are Active"
            stats.push({
                date: dateStr,
                visitors,
                signups,
                activations,
                upgrades,
                revenue: upgrades * 29,
                sources
            });
        }
        return { stats };
    }
    catch (error) {
        console.error("Error fetching analytics:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// --- Exam Update Monitor Functions ---
exports.checkForExamUpdates = functions.pubsub.schedule('every sunday 00:00').onRun(async (context) => {
    await (0, examWatch_1.performExamUpdateCheck)();
});
exports.triggerExamUpdateCheck = functions.https.onCall(async (data, context) => {
    // requireAdmin, not just "logged in". exam_update_sources is `allow read,
    // write: if isAdmin()` in firestore.rules, and this callable writes to it
    // with the Admin SDK — so a logged-in check made the callable a way around
    // the rule. This one also drives unbounded outbound fetches on demand.
    await requireAdmin(context);
    try {
        const results = await (0, examWatch_1.performExamUpdateCheck)();
        return { success: true, results };
    }
    catch (error) {
        console.error("Exam update check failed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// performExamUpdateCheck now lives in ./examWatch. The previous inline version
// detected the July 2026 PMP outline change and wrote it to a Firestore field
// that nothing read, so nobody found out for four weeks. See that module.
exports.markSourceReviewed = functions.https.onCall(async (data, context) => {
    // requireAdmin — this clears lastErrorCode/lastErrorMessage on the
    // exam-currency watcher. A logged-in check meant any registered user could
    // silence the alerting that exists because the July 2026 PMP outline change
    // went unnoticed for four weeks.
    await requireAdmin(context);
    if (!data.sourceId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing sourceId');
    const status = data.status || 'reviewed_ok';
    const note = data.note || null;
    try {
        await db.collection('exam_update_sources').doc(data.sourceId).update({
            status: status,
            lastHumanReviewedAt: admin.firestore.Timestamp.now(),
            lastHumanReviewNote: note,
            // Clear errors
            lastErrorCode: null,
            lastErrorMessage: null
        });
        return { success: true };
    }
    catch (error) {
        console.error("Failed to mark reviewed:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.seedExamSources = functions.https.onCall(async (data, context) => {
    // requireAdmin — writes the watched-source list that the exam-currency
    // monitor fetches. A logged-in check let any registered user rewrite which
    // URLs the platform polls.
    await requireAdmin(context);
    const sources = examWatch_1.EXAM_SOURCES;
    let created = 0;
    let updated = 0;
    for (const source of sources) {
        const snapshot = await db.collection('exam_update_sources').where('name', '==', source.name).get();
        const payload = Object.assign(Object.assign({}, source), (snapshot.empty
            ? {
                lastCheckedAt: null,
                lastSuccessAt: null,
                lastKnownSignature: null,
                lastKnownExcerpt: null,
                status: "never_fetched",
                lastChangeDetectedAt: null,
                consecutiveFailures: 0,
            }
            : {}));
        if (snapshot.empty) {
            await db.collection('exam_update_sources').add(payload);
            created++;
        }
        else {
            // Re-seeding refreshes the URL and exam linkage of an existing source,
            // which is how a stale watched URL gets corrected.
            await snapshot.docs[0].ref.set(payload, { merge: true });
            updated++;
        }
    }
    return { success: true, message: `Seeded ${created} new sources, refreshed ${updated}.`, total: sources.length };
});
// --- Session Cleanup Function ---
/**
 * Automatically closes abandoned sessions that haven't sent a heartbeat.
 * Runs every 5 minutes.
 */
exports.cleanupTimedOutSessions = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - 15);
    try {
        const expiredSessions = await db.collection('user_sessions')
            .where('logoutAt', '==', null)
            .where('lastSeenAt', '<', timeoutThreshold)
            .limit(500)
            .get();
        if (expiredSessions.empty) {
            return null;
        }
        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        expiredSessions.forEach(doc => {
            const data = doc.data();
            const loginAt = data.loginAt;
            let durationSec = null;
            if (loginAt && loginAt.toMillis) {
                durationSec = Math.round((now.toMillis() - loginAt.toMillis()) / 1000);
            }
            batch.update(doc.ref, {
                logoutAt: now,
                endedBy: 'timeout',
                durationSec: durationSec
            });
        });
        await batch.commit();
        console.log(`Successfully closed ${expiredSessions.size} timed-out sessions.`);
        return null;
    }
    catch (error) {
        console.error('Error cleaning up sessions:', error);
        return null;
    }
});
__exportStar(require("./tester_management"), exports);
__exportStar(require("./tutor"), exports);
__exportStar(require("./diagnostics"), exports);
__exportStar(require("./generateSmartQuizReview"), exports);
var validateQuizStart_1 = require("./validateQuizStart");
Object.defineProperty(exports, "validateQuizStart", { enumerable: true, get: function () { return validateQuizStart_1.validateQuizStart; } });
// Server-written free-tier usage ledger. Trigger increments usageCounters on
// every answer; validateQuizStart reads it. See usageLedger.ts.
var usageLedger_1 = require("./usageLedger");
Object.defineProperty(exports, "trackAnswerUsage", { enumerable: true, get: function () { return usageLedger_1.trackAnswerUsage; } });
var startTrialCallable_1 = require("./startTrialCallable");
Object.defineProperty(exports, "startTrial", { enumerable: true, get: function () { return startTrialCallable_1.startTrial; } });
var captureLead_1 = require("./captureLead");
Object.defineProperty(exports, "captureLead", { enumerable: true, get: function () { return captureLead_1.captureLead; } });
//# sourceMappingURL=index.js.map