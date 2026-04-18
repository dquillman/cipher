/**
 * Export questions to blooms-input.csv for Bloom's classification.
 *
 * Excludes junk exam IDs (placeholder/retired content) so we don't spend
 * API budget classifying garbage.
 *
 * Usage:
 *   node export-blooms-input.js
 *   node export-blooms-input.js --include-xdl   # include XDL93JSkkNPlofn0cjhM bank
 *   node export-blooms-input.js --all           # no exclusions (debug only)
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

admin.initializeApp({ projectId: "exam-coach-ai-platform" });
const db = admin.firestore();

const OUTPUT_FILE = path.join(__dirname, "blooms-input.csv");

// Known-junk exam IDs — AI-generated placeholder content not worth classifying
const JUNK_EXAM_IDS = new Set([
    "wjA7OjeAGpURXrbzDe5O",   // 15 broken-template questions
    "capm-exam",               // 10 broken-template questions
    "default-exam",            // 4 seed/test questions
    "retired-7qmPagj9A6RpkC0CwGkY", // retired PMP
]);

// Maybe-junk — opt-in via --include-xdl
const XDL = "XDL93JSkkNPlofn0cjhM";

const args = process.argv.slice(2);
const includeAll = args.includes("--all");
const includeXdl = args.includes("--include-xdl");

function escapeCsv(value) {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

async function main() {
    console.log("Fetching questions from Firestore...");
    const snap = await db.collection("questions").get();
    console.log(`Fetched ${snap.size} total documents.\n`);

    const rows = [];
    const excludedByExam = {};
    let skippedExisting = 0;

    snap.docs.forEach(doc => {
        const d = doc.data();
        const examId = d.examId || "unknown";

        if (!includeAll) {
            if (JUNK_EXAM_IDS.has(examId)) {
                excludedByExam[examId] = (excludedByExam[examId] || 0) + 1;
                return;
            }
            if (examId === XDL && !includeXdl) {
                excludedByExam[examId] = (excludedByExam[examId] || 0) + 1;
                return;
            }
        }

        // Skip questions that are already classified — resume-friendly
        if (d.bloomLevel) {
            skippedExisting++;
            return;
        }

        rows.push({
            id: doc.id,
            examId,
            domain: d.domain || "",
            type: d.type || "mcq",
            stem: (d.stem || "").trim(),
            options: Array.isArray(d.options) ? d.options.join(" | ") : "",
            explanation: (d.explanation || "").trim(),
        });
    });

    // Write CSV
    const header = ["id", "examId", "domain", "type", "stem", "options", "explanation"];
    const csv = [header.join(",")];
    rows.forEach(r => {
        csv.push(header.map(h => escapeCsv(r[h])).join(","));
    });
    fs.writeFileSync(OUTPUT_FILE, csv.join("\n"), "utf-8");

    console.log("=== EXPORT SUMMARY ===");
    console.log(`Exported:              ${rows.length}`);
    console.log(`Already have bloom:    ${skippedExisting}`);
    console.log(`Excluded (junk):       ${Object.values(excludedByExam).reduce((a, b) => a + b, 0)}`);
    Object.entries(excludedByExam).forEach(([id, n]) => console.log(`  - ${id}: ${n}`));
    console.log(`\nOutput: ${OUTPUT_FILE}`);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
