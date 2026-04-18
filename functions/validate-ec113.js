/**
 * EC-113 Question Validator
 *
 * Validates 35 rewritten PMP questions against quality criteria
 * using OpenAI structured output.
 *
 * - Reads rewrites from ec-113-batch-rewrites.json
 * - Pulls explanation, domain, difficulty from Firestore
 * - Sends each to GPT for structured validation
 * - Outputs ec-113-validation-report.json
 *
 * Usage:
 *   node validate-ec113.js               # full run
 *   node validate-ec113.js --resume      # resume from last progress
 *
 * API key: reads from Firebase functions config (openai.key)
 *          or OPENAI_API_KEY env var
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai").default;

// ── Config ──────────────────────────────────────────────────────────
const REWRITES_FILE = path.join(__dirname, "ec-113-batch-rewrites.json");
const OUTPUT_FILE = path.join(__dirname, "ec-113-validation-report.json");
const PROGRESS_FILE = path.join(__dirname, ".validate-progress.json");
const COLLECTION = "questions";

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 3;
const DELAY_MS = 1500;
const MAX_RETRIES = 3;

// ── Init Firebase ───────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ projectId: "exam-coach-ai-platform" });
}
const db = admin.firestore();

// ── Resolve API Key ─────────────────────────────────────────────────
async function getApiKey() {
  // Check env first
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  // Check --key flag
  const args = process.argv.slice(2);
  const keyIdx = args.indexOf("--key");
  if (keyIdx >= 0 && args[keyIdx + 1]) return args[keyIdx + 1];

  // Pull from Firebase functions config
  try {
    const { execSync } = require("child_process");
    const raw = execSync("firebase functions:config:get openai.key 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    // Config get returns JSON string like "sk-..."
    const cleaned = raw.replace(/^"|"$/g, "");
    if (cleaned.startsWith("sk-")) return cleaned;
  } catch (_) {
    // silent
  }

  // Pull from Firebase functions config (full object)
  try {
    const { execSync } = require("child_process");
    const raw = execSync("firebase functions:config:get 2>/dev/null", {
      encoding: "utf-8",
    });
    const config = JSON.parse(raw);
    if (config.openai && config.openai.key) return config.openai.key;
  } catch (_) {
    // silent
  }

  return null;
}

// ── Validation Prompt ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a PMP exam question quality validator. You will receive a complete question with stem, options, correct answer index, explanation, domain, and difficulty.

Validate the question and return ONLY a JSON object with these exact fields:

{
  "id": "<the question id>",
  "singleDefensibleAnswer": true/false,
  "distractorQuality": "strong" | "moderate" | "weak",
  "explanationAlignment": "aligned" | "partially_aligned" | "misaligned",
  "ambiguityRisk": "low" | "medium" | "high",
  "difficultyMatch": "correct" | "too_easy" | "too_hard",
  "needsRevision": true/false,
  "revisionNotes": "string explaining any issues, or empty string if clean"
}

Validation rules:
- singleDefensibleAnswer: Is there exactly ONE correct answer that is clearly best per PMI principles? If two options are equally defensible, mark false.
- distractorQuality: "strong" = all wrong answers are plausible PMI-aligned actions; "moderate" = 1-2 are plausible; "weak" = obvious throwaways exist.
- explanationAlignment: Does the explanation support why the correct answer is right and others are wrong?
- ambiguityRisk: Could a competent PMP candidate reasonably argue for a different answer? "high" = yes, multiple defensible; "medium" = edge case; "low" = clear.
- difficultyMatch: Does the question complexity match its stated difficulty (Easy/Medium/Hard)?
- needsRevision: true if any of: singleDefensibleAnswer is false, distractorQuality is "weak", ambiguityRisk is "high", or explanationAlignment is "misaligned".

Return ONLY valid JSON. No markdown, no explanation, no extra text.`;

function buildUserPrompt(q) {
  const optionsList = q.options
    .map((o, i) => `  ${i}: ${o}${i === q.correctAnswer ? " ← CORRECT" : ""}`)
    .join("\n");

  return `Question ID: ${q.id}
Domain: ${q.domain}
Difficulty: ${q.difficulty}

Stem:
${q.stem}

Options:
${optionsList}

Correct Answer Index: ${q.correctAnswer}

Explanation:
${q.explanation}`;
}

// ── API Call ─────────────────────────────────────────────────────────
async function validateQuestion(openai, question, retries = 0) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(question) },
      ],
    });

    const raw = response.choices[0].message.content.trim();

    // Strip markdown fences if present
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    // Ensure id is set
    parsed.id = question.id;
    return parsed;
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const wait = (retries + 1) * 2000;
      console.warn(`  Retry ${retries + 1}/${MAX_RETRIES} for ${question.id} (${wait}ms)...`);
      await sleep(wait);
      return validateQuestion(openai, question, retries + 1);
    }
    console.error(`  FAILED ${question.id} after ${MAX_RETRIES} retries:`, err.message);
    return {
      id: question.id,
      singleDefensibleAnswer: false,
      distractorQuality: "weak",
      explanationAlignment: "misaligned",
      ambiguityRisk: "high",
      difficultyMatch: "correct",
      needsRevision: true,
      revisionNotes: `VALIDATION ERROR: ${err.message}`,
    };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error("ERROR: No OpenAI API key found.");
    console.error("Set OPENAI_API_KEY env var, pass --key, or configure via firebase functions:config:set openai.key=...");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  const resumeMode = process.argv.includes("--resume");

  console.log("Project:", admin.app().options.projectId);
  console.log("Model:", MODEL);
  console.log("");

  // 1. Load rewrites
  const rewrites = JSON.parse(fs.readFileSync(REWRITES_FILE, "utf-8"));
  console.log(`Loaded ${rewrites.length} rewrites\n`);

  // 2. Enrich from Firestore (get explanation, domain, difficulty, correctAnswer)
  console.log("── Fetching Firestore data ──");
  const questions = [];
  for (const r of rewrites) {
    const snap = await db.collection(COLLECTION).doc(r.id).get();
    if (!snap.exists) {
      console.error(`  MISSING: ${r.id}`);
      continue;
    }
    const data = snap.data();
    questions.push({
      id: r.id,
      stem: r.stem,
      options: r.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation || "",
      domain: data.domain || "Unknown",
      difficulty: data.difficulty || "Unknown",
    });
    console.log(`  Loaded: ${r.id}`);
  }
  console.log(`\n${questions.length} questions enriched\n`);

  // 3. Load progress if resuming
  let completed = {};
  if (resumeMode && fs.existsSync(PROGRESS_FILE)) {
    const prev = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    prev.forEach((r) => { completed[r.id] = r; });
    console.log(`Resuming — ${Object.keys(completed).length} previously validated\n`);
  }

  // 4. Validate in batches
  const results = Object.values(completed);

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (q) => {
      if (completed[q.id]) return;

      const result = await validateQuestion(openai, q);
      results.push(result);
      completed[q.id] = result;
    });

    await Promise.all(promises);

    // Save progress
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results, null, 2));

    const done = Math.min(i + BATCH_SIZE, questions.length);
    console.log(`  ${done}/${questions.length} validated`);

    if (i + BATCH_SIZE < questions.length) {
      await sleep(DELAY_MS);
    }
  }

  // 5. Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Clean progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  // 6. Summary
  const total = results.length;
  const clean = results.filter((r) => !r.needsRevision).length;
  const needsRevision = results.filter((r) => r.needsRevision).length;
  const highAmbiguity = results.filter((r) => r.ambiguityRisk === "high").length;
  const weakDistractors = results.filter((r) => r.distractorQuality === "weak").length;
  const misaligned = results.filter((r) => r.explanationAlignment === "misaligned").length;
  const noDefensible = results.filter((r) => !r.singleDefensibleAnswer).length;

  console.log("\n══════════════════════════════════════");
  console.log("  EC-113 VALIDATION REPORT");
  console.log("══════════════════════════════════════");
  console.log(`  Total validated:          ${total}`);
  console.log(`  Clean (no revision):      ${clean}  (${((clean / total) * 100).toFixed(1)}%)`);
  console.log(`  Needs revision:           ${needsRevision}  (${((needsRevision / total) * 100).toFixed(1)}%)`);
  console.log(`  High ambiguity risk:      ${highAmbiguity}`);
  console.log(`  Weak distractors:         ${weakDistractors}`);
  console.log(`  Misaligned explanations:  ${misaligned}`);
  console.log(`  No defensible answer:     ${noDefensible}`);
  console.log("══════════════════════════════════════");

  if (needsRevision > 0) {
    console.log("\n── Questions Needing Revision ──");
    results
      .filter((r) => r.needsRevision)
      .forEach((r) => {
        console.log(`  ${r.id}`);
        console.log(`    Ambiguity: ${r.ambiguityRisk} | Distractors: ${r.distractorQuality} | Explanation: ${r.explanationAlignment}`);
        if (r.revisionNotes) console.log(`    Notes: ${r.revisionNotes}`);
        console.log("");
      });
  }

  console.log(`Output: ${path.basename(OUTPUT_FILE)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
