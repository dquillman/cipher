/**
 * Phase 2.5 audit: catch Apply misclassifications.
 *
 * The tuned classifier has ~5% false Apply rate — mostly on definitional stems
 * ("X involves:", "Which of the following is a permissible Y", etc.) that
 * lack a scenario but got force-fit into Apply.
 *
 * This script:
 *   1. Reads blooms-classified.csv
 *   2. Flags Apply rows whose stem lacks scenario markers
 *   3. Re-classifies ONLY those rows with a tighter prompt that biases toward
 *      Remember/Understand for definitional content
 *   4. Writes blooms-reclassified.csv with the before/after for manual review
 *
 * You then decide which rows to accept, and writeback-blooms.js picks up the
 * final authoritative labels from blooms-classified.csv (after you merge).
 *
 * Usage:
 *   node audit-blooms.js --key <OPENAI_KEY>
 *   node audit-blooms.js --key <OPENAI_KEY> --dry-run    # just list candidates, no API calls
 *   node audit-blooms.js --key <OPENAI_KEY> --limit 20   # sanity check on a small batch
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const CLASSIFIED_FILE = path.join(__dirname, "blooms-classified.csv");
const OUTPUT_FILE = path.join(__dirname, "blooms-reclassified.csv");
const MODEL = "gpt-4o";
const BATCH_SIZE = 5;
const DELAY_MS = 800;
const MAX_RETRIES = 3;

const args = process.argv.slice(2);
const getFlag = (name) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : null;
};
const OPENAI_KEY = getFlag("--key") || process.env.OPENAI_API_KEY || "";
const dryRun = args.includes("--dry-run");
const limit = parseInt(getFlag("--limit") || "0", 10);

if (!dryRun && !OPENAI_KEY) {
    console.error("Missing --key <OPENAI_KEY>. Get one from platform.openai.com.");
    process.exit(1);
}

// Scenario markers — if a stem contains any of these, it's probably a real scenario
// and the Apply label is likely legitimate.
const SCENARIO_MARKERS = [
    /\byou are\b/i, /\byou notice\b/i, /\byou discover\b/i, /\byou observe\b/i,
    /\byour team\b/i, /\byour project\b/i, /\byour organization\b/i,
    /\bthe PM\b/, /\bproject manager\b/i, /\bscrum master\b/i,
    /\bduring\b/i, /\bafter\b/i, /\bwhen\b/i, /\bwhile\b/i,
    /\ba team member\b/i, /\ba stakeholder\b/i, /\ba client\b/i, /\ba vendor\b/i,
    /\bdiscovers\b/i, /\bobserves\b/i, /\bnotices\b/i, /\brealizes\b/i,
    /\bexperiencing\b/i, /\bimplementing\b/i, /\bworking on\b/i,
    /\bis planning\b/i, /\bis managing\b/i, /\bis leading\b/i,
    /\bhas been\b/i, /\bhas discovered\b/i, /\bhas decided\b/i,
    /\bmeeting\b/i, /\bsprint\b/i, /\bbacklog\b/i,
];

// Definitional markers — if a stem starts with or heavily features these,
// it's more likely Remember or Understand than Apply.
const DEFINITIONAL_MARKERS = [
    /^which of the following\b/i,
    /^what is\b/i, /^what are\b/i,
    /\binvolves:?\s*$/i, /\bis defined as\b/i, /\brefers to\b/i, /\bmeans:?\s*$/i,
    /^the definition\b/i, /^the term\b/i, /^according to\b.+\bis:?\s*$/i,
];

function hasScenarioMarker(stem) {
    return SCENARIO_MARKERS.some(re => re.test(stem));
}

function looksDefinitional(stem) {
    return DEFINITIONAL_MARKERS.some(re => re.test(stem));
}

function parseCsv(raw) {
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

function escapeCsv(value) {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

const AUDIT_SYSTEM_PROMPT = `You are auditing Bloom's Taxonomy classifications for exam questions that may have been incorrectly labeled "Apply". The question bank is PMI/Scrum/ITIL/audit/HR certification prep.

The most common failure mode is labeling DEFINITIONAL questions (that test recall or understanding of a concept) as Apply. Your job is to correct these.

Bloom levels:
- Remember: recall of facts, terms, definitions. "Which is a BFOQ?" or "The definition of X is:" or "According to ITIL, Problem Management is:"
- Understand: explain meaning or classify concepts. "Reconciling the GL involves:" (asking the candidate to understand the process)
- Apply: use a methodology IN A SCENARIO. Requires a described situation (a person, a team, a project state, an event). "A PM discovers X. What should they do?"
- Analyze: differentiate components, compare factors, identify relationships
- Evaluate: judge with explicit trade-offs, defend a choice
- Create: synthesize something new

Decision tree for this audit:
1. Does the stem describe a concrete SCENARIO (a specific person, team, situation, event)?
   YES → Apply is likely correct. Keep Apply.
   NO → Continue to step 2.

2. Is the stem asking for a definition, list of steps, or categorical fact?
   YES → Remember or Understand (Remember if pure recall, Understand if the candidate must interpret/classify meaning).

3. Is the stem asking the candidate to differentiate or compare without judgment?
   → Analyze

4. Is the stem asking for a judgment call with explicit trade-offs?
   → Evaluate

DO NOT force-fit to Apply just because the question has multiple choices or uses "best". Definitional questions with no scenario are NOT Apply.

Respond in JSON: {"level": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create", "confidence": 0.0-1.0, "rationale": "one sentence"}`;

function buildUserPrompt(row) {
    return `Original classification: ${row.bloomLevel} (conf ${row.confidence})
Original rationale: ${row.rationale}

Stem: ${row.stem}
Options: ${row.options}
${row.explanation ? `Explanation: ${row.explanation}` : ''}

Audit this classification. Keep "Apply" only if there is a concrete scenario. Otherwise correct to the right level.`;
}

function callOpenAI(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: AUDIT_SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const req = https.request({
            method: "POST",
            hostname: "api.openai.com",
            path: "/v1/chat/completions",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "Content-Length": Buffer.byteLength(body),
            },
        }, (res) => {
            let data = "";
            res.on("data", (c) => data += c);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) throw new Error(parsed.error.message);
                    const content = parsed.choices[0].message.content;
                    resolve(JSON.parse(content));
                } catch (e) {
                    if (retries < MAX_RETRIES) {
                        setTimeout(() => callOpenAI(prompt, retries + 1).then(resolve, reject), 2000);
                    } else reject(e);
                }
            });
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    if (!fs.existsSync(CLASSIFIED_FILE)) {
        console.error(`Missing ${CLASSIFIED_FILE}. Run classify-blooms.js first.`);
        process.exit(1);
    }

    const raw = fs.readFileSync(CLASSIFIED_FILE, "utf-8");
    const grid = parseCsv(raw);
    const header = grid[0];
    const rows = grid.slice(1).map(r => {
        const obj = {};
        header.forEach((h, i) => obj[h] = r[i] || "");
        return obj;
    });

    // Find Apply rows lacking a scenario marker OR matching definitional markers
    const candidates = rows.filter(r => {
        if (r.bloomLevel !== "Apply") return false;
        const stem = r.stem || "";
        if (looksDefinitional(stem)) return true;
        if (!hasScenarioMarker(stem)) return true;
        return false;
    });

    console.log("=== AUDIT PLAN ===");
    console.log(`Total classified rows:  ${rows.length}`);
    console.log(`Apply rows:             ${rows.filter(r => r.bloomLevel === 'Apply').length}`);
    console.log(`Candidates to re-check: ${candidates.length}`);
    console.log(`Est. cost:              $${(candidates.length * 0.00015).toFixed(2)}`);
    console.log("");

    if (dryRun) {
        console.log("DRY RUN — sample of candidates:");
        candidates.slice(0, 20).forEach((c, i) => {
            console.log(`\n#${i + 1} [${c.id.slice(0, 12)}]`);
            console.log(`  ${c.stem.slice(0, 200)}`);
        });
        console.log(`\n\n(Re-run without --dry-run to re-classify.)`);
        process.exit(0);
    }

    const work = limit > 0 ? candidates.slice(0, limit) : candidates;
    console.log(`Re-classifying ${work.length} rows with audit prompt...\n`);

    const results = [];
    for (let i = 0; i < work.length; i += BATCH_SIZE) {
        const batch = work.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (row) => {
            try {
                const resp = await callOpenAI(buildUserPrompt(row));
                return { ...row, newLevel: resp.level, newConfidence: resp.confidence, newRationale: resp.rationale };
            } catch (e) {
                return { ...row, newLevel: "ERROR", newConfidence: 0, newRationale: e.message };
            }
        }));
        results.push(...batchResults);
        process.stdout.write(`\r  Processed ${results.length}/${work.length}   `);
        if (i + BATCH_SIZE < work.length) await new Promise(r => setTimeout(r, DELAY_MS));
    }
    console.log("\n");

    // Write results
    const outHeader = ["id", "examId", "stem", "options", "oldLevel", "oldConfidence", "newLevel", "newConfidence", "changed", "newRationale"];
    const outCsv = [outHeader.join(",")];
    let changedCount = 0;
    const newDistribution = {};
    results.forEach(r => {
        const changed = r.newLevel !== r.bloomLevel;
        if (changed) changedCount++;
        newDistribution[r.newLevel] = (newDistribution[r.newLevel] || 0) + 1;
        outCsv.push([
            r.id, r.examId, r.stem, r.options,
            r.bloomLevel, r.confidence, r.newLevel, r.newConfidence,
            changed ? "YES" : "no", r.newRationale
        ].map(escapeCsv).join(","));
    });
    fs.writeFileSync(OUTPUT_FILE, outCsv.join("\n"), "utf-8");

    console.log("=== AUDIT RESULTS ===");
    console.log(`Audited:         ${results.length}`);
    console.log(`Changed:         ${changedCount}`);
    console.log(`Kept as Apply:   ${results.length - changedCount}`);
    console.log(`New distribution for audited rows:`);
    Object.entries(newDistribution).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
        console.log(`  ${k.padEnd(14)} ${v}`)
    );
    console.log(`\nOutput: ${OUTPUT_FILE}`);
    console.log(`\nNext: review the CSV. To apply the changes to blooms-classified.csv, run:`);
    console.log(`  node merge-audit.js`);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
