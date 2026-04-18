/**
 * EC Scenario Bucket Classifier
 *
 * Reads ec-question-scenario-audit.csv, sends each question preview
 * to OpenAI for classification into a scenario bucket, and outputs
 * ec-question-scenario-classified.csv with the ScenarioBucket column.
 *
 * Reusable for any future bank expansion.
 *
 * Requirements:
 *   OPENAI_API_KEY environment variable (or pass via --key flag)
 *
 * Usage:
 *   set OPENAI_API_KEY=sk-...
 *   node classify-scenarios.js
 *
 *   # Or pass key directly:
 *   node classify-scenarios.js --key sk-...
 *
 *   # Resume from where you left off after an interruption:
 *   node classify-scenarios.js --resume
 */

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai").default;

// ── Config ──────────────────────────────────────────────────────────
const INPUT_FILE = path.join(__dirname, "ec-question-scenario-audit.csv");
const OUTPUT_FILE = path.join(__dirname, "ec-question-scenario-classified.csv");
const PROGRESS_FILE = path.join(__dirname, ".classify-progress.json");

const VALID_BUCKETS = [
  "Governance",
  "Value",
  "Risk",
  "Hybrid",
  "Stakeholder Politics",
  "Procurement",
  "Data/EVM",
  "Ethics",
  "Multi-Team",
  "Product Reality",
];

const BATCH_SIZE = 5;        // Concurrent requests per batch
const DELAY_MS = 1200;       // Delay between batches (rate-limit friendly)
const MAX_RETRIES = 3;       // Retries per question on failure
const MODEL = "gpt-4o-mini"; // Fast, cheap, accurate enough for classification

// ── Parse args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const keyFlagIdx = args.indexOf("--key");
const apiKey =
  (keyFlagIdx >= 0 ? args[keyFlagIdx + 1] : null) ||
  process.env.OPENAI_API_KEY;
const resumeMode = args.includes("--resume");

if (!apiKey) {
  console.error("ERROR: No API key provided.");
  console.error("Set OPENAI_API_KEY env var or pass --key sk-...");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

// ── CSV helpers ─────────────────────────────────────────────────────
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ── Classification ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a PMP exam content classifier. Given a question preview, classify it into exactly ONE of these scenario buckets:

${VALID_BUCKETS.map((b) => `- ${b}`).join("\n")}

Respond with ONLY the bucket name. No explanation, no punctuation, no extra text.

Bucket definitions:
- Governance: Project charter, authority, oversight, compliance, audits, PMO
- Value: Business case, benefits realization, ROI, strategic alignment
- Risk: Risk identification, analysis, response, monitoring, contingency
- Hybrid: Agile-waterfall transition, hybrid methodology, adaptive approaches
- Stakeholder Politics: Stakeholder conflict, influence, engagement, expectations
- Procurement: Contracts, vendors, make-or-buy, procurement management
- Data/EVM: Earned value, SPI/CPI, variance analysis, metrics, EMV calculations
- Ethics: Professional responsibility, code of conduct, conflicts of interest
- Multi-Team: Cross-functional teams, remote teams, team dynamics, collaboration
- Product Reality: Scope, quality, deliverables, requirements, schedule management`;

async function classifyQuestion(preview, retries = 0) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 20,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: preview },
      ],
    });

    const raw = response.choices[0].message.content.trim();

    // Fuzzy match against valid buckets
    const match = VALID_BUCKETS.find(
      (b) => b.toLowerCase() === raw.toLowerCase()
    );
    if (match) return match;

    // Partial match fallback
    const partial = VALID_BUCKETS.find((b) =>
      raw.toLowerCase().includes(b.toLowerCase())
    );
    if (partial) return partial;

    console.warn(`  Unexpected response "${raw}" — defaulting to "Product Reality"`);
    return "Product Reality";
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const wait = (retries + 1) * 2000;
      console.warn(`  Retry ${retries + 1}/${MAX_RETRIES} after ${wait}ms...`);
      await sleep(wait);
      return classifyQuestion(preview, retries + 1);
    }
    console.error(`  Failed after ${MAX_RETRIES} retries:`, err.message);
    return "UNCLASSIFIED";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  // Read input CSV
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("Input file not found:", INPUT_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const header = lines[0];
  const dataLines = lines.slice(1);

  console.log(`Loaded ${dataLines.length} questions from ${path.basename(INPUT_FILE)}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Batch size: ${BATCH_SIZE}, delay: ${DELAY_MS}ms`);
  console.log("");

  // Parse rows
  const rows = dataLines.map((line) => {
    const [id, domain, difficulty, preview, contentVersion] = parseCsvLine(line);
    return { id, domain, difficulty, preview, contentVersion, bucket: "" };
  });

  // Load progress if resuming
  let completed = {};
  if (resumeMode && fs.existsSync(PROGRESS_FILE)) {
    completed = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    const count = Object.keys(completed).length;
    console.log(`Resuming — ${count} previously classified\n`);
  }

  // Process in batches
  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (row) => {
      if (completed[row.id]) {
        row.bucket = completed[row.id];
        return;
      }

      row.bucket = await classifyQuestion(row.preview);
      completed[row.id] = row.bucket;
      processed++;
    });

    await Promise.all(promises);

    // Save progress after each batch
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(completed, null, 2));

    const done = Math.min(i + BATCH_SIZE, rows.length);
    console.log(`  ${done}/${rows.length} classified`);

    if (i + BATCH_SIZE < rows.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write output CSV
  const outHeader = "id,domain,difficulty,preview,contentVersion,ScenarioBucket";
  const outLines = rows.map((r) =>
    [
      escapeCsv(r.id),
      escapeCsv(r.domain),
      escapeCsv(r.difficulty),
      escapeCsv(r.preview),
      escapeCsv(r.contentVersion),
      escapeCsv(r.bucket),
    ].join(",")
  );

  fs.writeFileSync(OUTPUT_FILE, [outHeader, ...outLines].join("\n"), "utf-8");

  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  // Summary
  const bucketCounts = {};
  rows.forEach((r) => {
    bucketCounts[r.bucket] = (bucketCounts[r.bucket] || 0) + 1;
  });

  console.log("\n── Bucket Distribution ──");
  Object.entries(bucketCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([bucket, count]) => {
      const pct = ((count / rows.length) * 100).toFixed(1);
      const bar = "█".repeat(Math.round(count / 2));
      console.log(`  ${bucket.padEnd(22)} ${String(count).padStart(3)}  (${pct.padStart(5)}%)  ${bar}`);
    });

  console.log(`\nTotal classified: ${rows.length}`);
  console.log(`New this run: ${processed}`);
  console.log(`Output: ${path.basename(OUTPUT_FILE)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
