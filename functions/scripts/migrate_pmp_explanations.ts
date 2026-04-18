/**
 * EC-120 Migration: Regenerate PMP Question Explanations
 *
 * Replaces the `explanation` field on all PMP questions with GPT-4o
 * structured output. Does NOT modify stem, options, correctAnswer, or IDs.
 *
 * Usage:
 *   DRY RUN (default — logs what would change, writes nothing):
 *     npx ts-node scripts/migrate_pmp_explanations.ts
 *
 *   LIVE RUN (writes to Firestore):
 *     DRY_RUN=false npx ts-node scripts/migrate_pmp_explanations.ts
 *
 *   RESUME from a specific doc ID (alphabetical):
 *     RESUME_AFTER=<lastDocId> npx ts-node scripts/migrate_pmp_explanations.ts
 *
 * Prerequisites:
 *   - OPENAI_API_KEY in env, or firebase functions config (functions.config().openai.key)
 *   - Either GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key,
 *     or run `firebase login` + default credentials
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// ── Configuration ──────────────────────────────────────────────────────────

const PROJECT_ID = 'exam-coach-ai-platform';
const PMP_EXAM_ID = '7qmPagj9A6RpkC0CwGkY';
const BATCH_SIZE = 10;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default: true (safe)
const RESUME_AFTER = process.env.RESUME_AFTER || null;

// ── Firebase Init ──────────────────────────────────────────────────────────

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        projectId: PROJECT_ID
    });
    console.log('Initialized with serviceAccountKey.json');
} else {
    admin.initializeApp({ projectId: PROJECT_ID });
    console.log(`Initialized with default credentials for project: ${PROJECT_ID}`);
}

const db = admin.firestore();

// ── Safety Check ───────────────────────────────────────────────────────────

if (admin.app().options.projectId !== PROJECT_ID) {
    console.error(`CRITICAL: Project mismatch. Got ${admin.app().options.projectId}, expected ${PROJECT_ID}`);
    process.exit(1);
}

// ── OpenAI Init ────────────────────────────────────────────────────────────

const apiKey =
    process.env.OPENAI_API_KEY ||
    ((() => { try { return functions.config()?.openai?.key; } catch { return undefined; } })());

if (!apiKey || apiKey === 'dummy-key-for-build' || apiKey === 'dummy-key-for-deploy') {
    console.error('OpenAI API key not found. Set OPENAI_API_KEY or configure via firebase functions:config:set openai.key=<key>');
    process.exit(1);
}
console.log(`OpenAI key source: ${process.env.OPENAI_API_KEY ? 'environment variable' : 'functions.config()'}`);
const openai = new OpenAI({ apiKey });

// ── Prompt ─────────────────────────────────────────────────────────────────

function buildExplanationPrompt(stem: string, options: string[], correctAnswer: number): { system: string; user: string } {
    const labels = ['A', 'B', 'C', 'D'];
    const optionsLabeled = options.map((opt, i) => `${labels[i]}. ${opt}`).join('\n');
    const correctLabel = labels[correctAnswer];
    const correctText = options[correctAnswer];

    return {
        system: `You are a senior PMP instructor writing exam explanations for a study app.
Your output will be rendered with these exact section markers. Follow the format precisely.

OUTPUT FORMAT (sections separated by double newlines):
1. Begin with clear reasoning explaining why the correct answer is correct. Do NOT prefix this section with a label.
2. "PMI Decision Lens:" — identify the specific PMI principle, mindset, or framework being applied.
3. "Why this conflicts:" — explicitly analyze EACH incorrect option by name (${labels.filter((_, i) => i !== correctAnswer).join(', ')}). For each distractor: state what it suggests and explain precisely why it fails in this scenario. Do NOT use generic phrases like "skip foundational steps" or "address symptoms rather than root causes." Be concrete and scenario-specific.
4. "Pattern:" — provide a reusable heuristic for similar PMP questions.

CONSTRAINTS:
- The explanation must read like a senior PMP instructor reviewing a real exam scenario.
- Every distractor must be analyzed individually with scenario-specific reasoning.
- Avoid generic filler language.
- Keep total length under 400 words.
- Return ONLY the explanation text — no JSON, no markdown fences.`,

        user: `Question:
${stem}

Options:
${optionsLabeled}

Correct Answer: ${correctLabel}. ${correctText}

Write the structured explanation.`
    };
}

// ── Regeneration ───────────────────────────────────────────────────────────

async function regenerateExplanation(stem: string, options: string[], correctAnswer: number): Promise<string> {
    const { system, user } = buildExplanationPrompt(stem, options, correctAnswer);

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
        ],
        temperature: 0.4,
        max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content || content.trim().length < 50) {
        throw new Error('GPT-4o returned empty or too-short response');
    }
    return content.trim();
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateExplanation(explanation: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!explanation.includes('PMI Decision Lens:')) {
        issues.push('Missing "PMI Decision Lens:" section');
    }
    if (!explanation.includes('Why this conflicts:')) {
        issues.push('Missing "Why this conflicts:" section');
    }
    if (!explanation.includes('Pattern:')) {
        issues.push('Missing "Pattern:" section');
    }

    // Check for the generic filler we're trying to eliminate
    const genericPatterns = [
        'skip this foundational step',
        'address symptoms rather than root causes',
        'skips this foundational',
        'addresses symptoms rather than',
    ];
    for (const pattern of genericPatterns) {
        if (explanation.toLowerCase().includes(pattern)) {
            issues.push(`Contains generic filler: "${pattern}"`);
        }
    }

    return { valid: issues.length === 0, issues };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  EC-120: PMP Explanation Migration');
    console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : '🔴 LIVE — writing to Firestore'}`);
    console.log(`  Project: ${PROJECT_ID}`);
    console.log(`  PMP Exam ID: ${PMP_EXAM_ID}`);
    if (RESUME_AFTER) console.log(`  Resuming after doc: ${RESUME_AFTER}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Query all PMP questions, ordered by doc ID for resumability
    let query = db.collection('questions')
        .where('examId', '==', PMP_EXAM_ID)
        .orderBy(admin.firestore.FieldPath.documentId());

    if (RESUME_AFTER) {
        query = query.startAfter(RESUME_AFTER);
    }

    const snapshot = await query.get();
    const total = snapshot.size;
    console.log(`Found ${total} PMP questions${RESUME_AFTER ? ' (after resume point)' : ''}.\n`);

    if (total === 0) {
        console.log('Nothing to migrate.');
        return;
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const failedIds: string[] = [];

    // Process in batches
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        const writeBatch = db.batch();
        let batchWrites = 0;

        for (const doc of batch) {
            const data = doc.data();
            const docId = doc.id;
            processed++;

            // Validate required fields exist
            if (!data.stem || !Array.isArray(data.options) || data.correctAnswer === undefined) {
                console.log(`  [SKIP] ${docId} — missing stem/options/correctAnswer`);
                skipped++;
                continue;
            }

            try {
                console.log(`  [${processed}/${total}] ${docId} — "${data.stem.substring(0, 60)}..."`);

                const newExplanation = await regenerateExplanation(
                    data.stem,
                    data.options,
                    data.correctAnswer
                );

                // Validate structure
                const { valid, issues } = validateExplanation(newExplanation);
                if (!valid) {
                    console.log(`    ⚠ Validation issues: ${issues.join('; ')}`);
                    // Still proceed — these are warnings, not blockers
                }

                if (DRY_RUN) {
                    console.log(`    [DRY] Would replace explanation (${data.explanation?.length || 0} → ${newExplanation.length} chars)`);
                    // Show first 200 chars of new explanation
                    console.log(`    [DRY] Preview: ${newExplanation.substring(0, 200)}...`);
                } else {
                    writeBatch.update(doc.ref, { explanation: newExplanation });
                    batchWrites++;
                }
                updated++;

            } catch (err: any) {
                console.error(`    ✗ FAILED: ${err.message}`);
                failedIds.push(docId);
                failed++;
            }
        }

        // Commit batch
        if (!DRY_RUN && batchWrites > 0) {
            await writeBatch.commit();
            console.log(`  ✓ Committed batch of ${batchWrites} writes.\n`);
        } else if (DRY_RUN) {
            console.log(`  [DRY] Batch of ${batch.length} — no writes.\n`);
        }

        // Brief pause between batches to avoid rate limits
        if (i + BATCH_SIZE < docs.length) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Total queried: ${total}`);
    console.log(`  Processed:     ${processed}`);
    console.log(`  Updated:       ${updated}`);
    console.log(`  Skipped:       ${skipped}`);
    console.log(`  Failed:        ${failed}`);
    if (failedIds.length > 0) {
        console.log(`  Failed IDs:    ${failedIds.join(', ')}`);
    }
    if (DRY_RUN) {
        console.log('\n  ℹ This was a DRY RUN. No data was modified.');
        console.log('  To run for real: DRY_RUN=false npx ts-node scripts/migrate_pmp_explanations.ts');
    }
    console.log('═══════════════════════════════════════════════════\n');

    // Write failed IDs to file for easy retry
    if (failedIds.length > 0) {
        const failPath = path.resolve(__dirname, 'migration_failures.json');
        fs.writeFileSync(failPath, JSON.stringify(failedIds, null, 2));
        console.log(`Failed IDs written to: ${failPath}`);
    }
}

run().catch(err => {
    console.error('Migration crashed:', err);
    process.exit(1);
});
