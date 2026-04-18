/**
 * Classify exam questions by Bloom's Taxonomy cognitive level.
 *
 * Reads blooms-input.csv, sends each question to OpenAI with a structured
 * prompt, writes blooms-classified.csv with bloomLevel + confidence + rationale.
 *
 * Model: gpt-4o (higher accuracy than mini for a taxonomy this subtle).
 * Budget for ~1,900 questions: ~$3.50.
 *
 * Usage:
 *   set OPENAI_API_KEY=sk-...
 *   node classify-blooms.js
 *   node classify-blooms.js --resume          # continue after interruption
 *   node classify-blooms.js --model gpt-4o-mini --key sk-...
 *   node classify-blooms.js --limit 50        # sample run for spot-checking
 */

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai").default || require("openai");

// ── Config ──────────────────────────────────────────────────────────
const INPUT_FILE = path.join(__dirname, "blooms-input.csv");
const OUTPUT_FILE = path.join(__dirname, "blooms-classified.csv");
const PROGRESS_FILE = path.join(__dirname, ".blooms-progress.json");

const VALID_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const DEFAULT_MODEL = "gpt-4o";
const BATCH_SIZE = 5;
const DELAY_MS = 800;
const MAX_RETRIES = 3;

// ── Args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getFlag = (name) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : null;
};
const apiKey = getFlag("--key") || process.env.OPENAI_API_KEY;
const model = getFlag("--model") || DEFAULT_MODEL;
const limit = parseInt(getFlag("--limit") || "0", 10);
const resumeMode = args.includes("--resume");

if (!apiKey) {
    console.error("ERROR: No API key. Set OPENAI_API_KEY or pass --key sk-...");
    process.exit(1);
}

const openai = new OpenAI({ apiKey });

// ── CSV helpers ─────────────────────────────────────────────────────
function parseCsvLine(line) {
    const fields = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') { inQ = false; }
            else { cur += ch; }
        } else {
            if (ch === '"') inQ = true;
            else if (ch === ",") { fields.push(cur); cur = ""; }
            else { cur += ch; }
        }
    }
    fields.push(cur);
    return fields;
}

function escapeCsv(v) {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function parseCsv(raw) {
    // Handle quoted fields with embedded newlines by scanning the full text
    const rows = [];
    let cur = "";
    let inQ = false;
    const tokens = [[]];
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (inQ) {
            if (ch === '"' && raw[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') { inQ = false; }
            else { cur += ch; }
        } else {
            if (ch === '"') inQ = true;
            else if (ch === ",") { tokens[tokens.length - 1].push(cur); cur = ""; }
            else if (ch === "\n") { tokens[tokens.length - 1].push(cur); cur = ""; tokens.push([]); }
            else if (ch === "\r") { /* skip */ }
            else { cur += ch; }
        }
    }
    if (cur.length || tokens[tokens.length - 1].length) tokens[tokens.length - 1].push(cur);
    return tokens.filter(r => r.length > 1 || (r.length === 1 && r[0].length));
}

// ── Prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a cognitive-science classifier for certification exam multiple-choice questions.

Classify each question by the Bloom's Taxonomy level of thinking a test-taker must use to answer it CORRECTLY.

CRITICAL CONTEXT: These are professional certification exam questions (PMP, SHRM-CP, ITIL, CPP, CIA, Security+, etc.). In this specific question format:
- The DEFAULT is Apply. Most scenario-based MCQ cert questions are Apply.
- "BEST" / "MOST appropriate" / "first step" in a cert-exam scenario almost ALWAYS means "which option correctly applies the methodology/framework" — this is Apply, NOT Evaluate.
- Classify AWAY from Apply only when the question specifically demands the higher cognitive work described below.

DECISION TREE (apply in order — stop at first match):

Step 1. Is the stem a definition, acronym, or pure fact-recall with NO scenario?
  YES → Remember
  Examples: "What does WBS stand for?" "How many domains in the CPP exam?"

Step 2. Does the stem ask the test-taker to explain a concept's MEANING or PURPOSE, or to interpret/compare concepts, with NO real-world scenario to act on?
  YES → Understand
  Examples: "What is the purpose of a risk register?" "Which statement describes servant leadership?"

Step 3. Does the stem explicitly ask WHY something is happening, identify a ROOT CAUSE from symptoms, or diagnose WHICH FACTOR explains an observation?
  (Not "what should I do" — that's Apply. Analyze requires the answer to be a CAUSE or EXPLANATION, not an ACTION.)
  YES → Analyze
  Examples:
    - "Velocity has dropped three sprints in a row. Which is the MOST LIKELY cause of the decline?"
    - "An audit finds control failures clustered in month-end close. The symptoms best indicate:"
  NOT Analyze: "The Scrum team is having conflicts. What should the Scrum Master do?" (That's Apply — the answer is an action.)

Step 4. Is the test-taker being asked to JUDGE between 2+ competing STRATEGIC OPTIONS with genuine trade-offs (not a methodology-prescribed right answer)?
  (Ethics dilemmas with competing duties, strategic choices where multiple options are defensibly correct, and the exam is testing judgment rather than recall of what methodology prescribes.)
  YES → Evaluate
  Examples:
    - Ethics: "An auditor finds evidence of fraud by a senior official. Policy requires clearance by that official. What should the auditor do?" (Competing ethical obligations, no prescribed PMI/IIA answer.)
    - "Two equally valid mitigation strategies exist. Which is more appropriate given the risk tolerance profile?"
  NOT Evaluate: Anything where PMI/PMBOK/ITIL/IIA/etc. prescribes a clear right answer, even if phrased as "BEST" or "MOST appropriate."

Step 5. Does the test-taker have to DESIGN, CONSTRUCT, or SYNTHESIZE something new?
  YES → Create (very rare in MCQ — usually a PBQ)

Step 6. Default → Apply
  Use of methodology/framework/rule in a scenario. "What should the PM/Scrum Master/auditor/analyst do?" is almost always Apply.

BIAS CORRECTION — common LLM failure modes to avoid:
- Do NOT classify as Evaluate just because the question uses "BEST" or has multiple plausible-sounding options. Every MCQ has plausible-sounding distractors; that does not make it Evaluate.
- Do NOT classify as Analyze just because the scenario describes a problem. Analyze requires the ANSWER to be a cause/explanation, not a corrective action.
- If in doubt between Apply and Evaluate → choose Apply.
- If in doubt between Apply and Analyze → choose Apply.

Respond ONLY with a JSON object:
{"level": "<Remember|Understand|Apply|Analyze|Evaluate|Create>", "confidence": <0.0-1.0>, "rationale": "<one short sentence>"}

No markdown, no code fences, no extra text.`;

function buildUserMessage(row) {
    const parts = [`STEM: ${row.stem}`];
    if (row.options) parts.push(`OPTIONS: ${row.options}`);
    if (row.explanation) parts.push(`EXPLANATION: ${row.explanation.slice(0, 600)}`);
    return parts.join("\n\n");
}

async function classify(row, retries = 0) {
    try {
        const res = await openai.chat.completions.create({
            model,
            temperature: 0,
            max_tokens: 120,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: buildUserMessage(row) },
            ],
        });
        const raw = res.choices[0].message.content.trim();
        let parsed;
        try { parsed = JSON.parse(raw); }
        catch { throw new Error(`Unparseable JSON: ${raw.slice(0, 200)}`); }

        const level = VALID_LEVELS.find(
            l => l.toLowerCase() === String(parsed.level || "").toLowerCase()
        );
        if (!level) throw new Error(`Invalid level: ${parsed.level}`);

        const confidence = typeof parsed.confidence === "number"
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.5;
        const rationale = String(parsed.rationale || "").slice(0, 200);

        return { level, confidence, rationale };
    } catch (err) {
        if (retries < MAX_RETRIES) {
            const wait = (retries + 1) * 2000;
            console.warn(`  retry ${retries + 1}/${MAX_RETRIES} (${err.message.slice(0, 80)}) in ${wait}ms`);
            await new Promise(r => setTimeout(r, wait));
            return classify(row, retries + 1);
        }
        console.error(`  FAILED ${row.id}: ${err.message}`);
        return { level: "UNCLASSIFIED", confidence: 0, rationale: `error: ${err.message.slice(0, 100)}` };
    }
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input not found: ${INPUT_FILE}`);
        console.error(`Run: node export-blooms-input.js`);
        process.exit(1);
    }

    const raw = fs.readFileSync(INPUT_FILE, "utf-8");
    const grid = parseCsv(raw);
    const header = grid[0];
    const rows = grid.slice(1).map(fields => {
        const r = {};
        header.forEach((h, i) => r[h] = fields[i] || "");
        return r;
    });

    let toProcess = rows;
    if (limit > 0) toProcess = rows.slice(0, limit);

    // Resume
    let done = {};
    if (resumeMode && fs.existsSync(PROGRESS_FILE)) {
        done = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
        console.log(`Resuming — ${Object.keys(done).length} already classified.`);
    }

    const pending = toProcess.filter(r => !done[r.id]);
    console.log(`Model: ${model}`);
    console.log(`Total: ${toProcess.length}  |  Pending: ${pending.length}  |  Batch: ${BATCH_SIZE}`);
    console.log("");

    let processed = 0;
    const startTs = Date.now();

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(r => classify(r)));
        batch.forEach((r, idx) => {
            done[r.id] = results[idx];
        });
        processed += batch.length;

        // Checkpoint every batch
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(done, null, 0));

        const elapsed = (Date.now() - startTs) / 1000;
        const rate = processed / elapsed;
        const eta = Math.max(0, (pending.length - processed) / rate);
        process.stdout.write(`\r  ${processed}/${pending.length}  (${rate.toFixed(1)}/s, ETA ${Math.round(eta)}s)   `);

        if (i + BATCH_SIZE < pending.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }
    console.log("\n");

    // Write final CSV
    const outHeader = [...header, "bloomLevel", "confidence", "rationale"];
    const out = [outHeader.join(",")];
    toProcess.forEach(r => {
        const c = done[r.id] || { level: "UNCLASSIFIED", confidence: 0, rationale: "" };
        const row = [...header.map(h => r[h]), c.level, c.confidence.toFixed(2), c.rationale];
        out.push(row.map(escapeCsv).join(","));
    });
    fs.writeFileSync(OUTPUT_FILE, out.join("\n"), "utf-8");

    // Summary
    const counts = {};
    let lowConf = 0;
    let failed = 0;
    toProcess.forEach(r => {
        const c = done[r.id];
        if (!c) return;
        counts[c.level] = (counts[c.level] || 0) + 1;
        if (c.level === "UNCLASSIFIED") failed++;
        else if (c.confidence < 0.65) lowConf++;
    });

    console.log("=== CLASSIFICATION SUMMARY ===");
    VALID_LEVELS.forEach(l => {
        const n = counts[l] || 0;
        const pct = ((n / toProcess.length) * 100).toFixed(1);
        console.log(`  ${l.padEnd(12)} ${String(n).padStart(5)}  (${pct}%)`);
    });
    if (counts["UNCLASSIFIED"]) console.log(`  FAILED       ${String(failed).padStart(5)}`);
    console.log(`\nLow-confidence (<0.65): ${lowConf}  ← review these before writeback`);
    console.log(`\nOutput: ${OUTPUT_FILE}`);
    console.log(`Progress: ${PROGRESS_FILE}`);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
