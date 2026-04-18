/**
 * Apply Bloom's classifications back to Firestore.
 *
 * Reads blooms-classified.csv. For each row with a valid bloomLevel,
 * updates the Firestore question document with:
 *   - bloomLevel: "Remember" | "Understand" | ... | "Create"
 *   - bloomConfidence: number (0-1)
 *   - bloomClassifiedAt: server timestamp
 *
 * ALWAYS does a dry-run first. Pass --commit to actually write.
 *
 * Usage:
 *   node writeback-blooms.js                    # dry-run (default, safe)
 *   node writeback-blooms.js --commit           # actually write
 *   node writeback-blooms.js --commit --min-confidence 0.7
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

admin.initializeApp({ projectId: "exam-coach-ai-platform" });
const db = admin.firestore();

const INPUT_FILE = path.join(__dirname, "blooms-classified.csv");

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const getFlag = (name) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : null;
};
const minConfidence = parseFloat(getFlag("--min-confidence") || "0");

const VALID_LEVELS = new Set(["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]);

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

async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Missing ${INPUT_FILE}. Run classify-blooms.js first.`);
        process.exit(1);
    }

    const raw = fs.readFileSync(INPUT_FILE, "utf-8");
    const grid = parseCsv(raw);
    const header = grid[0];
    const idIdx = header.indexOf("id");
    const levelIdx = header.indexOf("bloomLevel");
    const confIdx = header.indexOf("confidence");

    if (idIdx < 0 || levelIdx < 0) {
        console.error("CSV missing id or bloomLevel column.");
        process.exit(1);
    }

    const rows = grid.slice(1).filter(r => r.length > 1);
    const updates = [];
    const skipped = { unclassified: 0, lowConfidence: 0, invalid: 0 };

    rows.forEach(r => {
        const id = r[idIdx];
        const level = r[levelIdx];
        const conf = parseFloat(r[confIdx] || "0");
        if (!VALID_LEVELS.has(level)) { skipped.invalid++; return; }
        if (level === "UNCLASSIFIED") { skipped.unclassified++; return; }
        if (conf < minConfidence) { skipped.lowConfidence++; return; }
        updates.push({ id, level, conf });
    });

    console.log("=== WRITEBACK PLAN ===");
    console.log(`Total rows in CSV:      ${rows.length}`);
    console.log(`Will update:            ${updates.length}`);
    console.log(`Skipped (unclassified): ${skipped.unclassified}`);
    console.log(`Skipped (low-conf):     ${skipped.lowConfidence}  (threshold ${minConfidence})`);
    console.log(`Skipped (invalid):      ${skipped.invalid}`);
    console.log("");

    if (!commit) {
        console.log("DRY RUN — nothing written. Sample of first 5 updates:");
        updates.slice(0, 5).forEach(u =>
            console.log(`  ${u.id.slice(0, 24).padEnd(26)} -> ${u.level} (${u.conf.toFixed(2)})`)
        );
        console.log("\nRe-run with --commit to write to Firestore.");
        process.exit(0);
    }

    console.log("COMMIT mode — writing to Firestore in batches of 400...");
    const now = admin.firestore.FieldValue.serverTimestamp();
    let written = 0;
    for (let i = 0; i < updates.length; i += 400) {
        const batch = db.batch();
        const chunk = updates.slice(i, i + 400);
        chunk.forEach(u => {
            const ref = db.collection("questions").doc(u.id);
            batch.update(ref, {
                bloomLevel: u.level,
                bloomConfidence: u.conf,
                bloomClassifiedAt: now,
            });
        });
        await batch.commit();
        written += chunk.length;
        process.stdout.write(`\r  Written ${written}/${updates.length}   `);
    }
    console.log("\nDone.");
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
