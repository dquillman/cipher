/**
 * EC Question Audit CSV Export
 *
 * Exports all PMP questions from Firestore to CSV for scenario analysis.
 * Read-only — no writes to Firestore.
 *
 * Usage:
 *   node export-question-audit.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "ec-question-scenario-audit.csv");
const COLLECTION = "questions";
const PMP_EXAM_ID = "7qmPagj9A6RpkC0CwGkY";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "exam-coach-ai-platform" });
}

const db = admin.firestore();

function escapeCsv(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function truncate(text, max) {
  const clean = String(text || "").replace(/[\r\n]+/g, " ").trim();
  return clean.length > max ? clean.substring(0, max) + "..." : clean;
}

async function main() {
  console.log("Project:", admin.app().options.projectId);
  console.log("Fetching questions...\n");

  const snap = await db
    .collection(COLLECTION)
    .where("examId", "==", PMP_EXAM_ID)
    .get();

  if (snap.empty) {
    console.log("No questions found.");
    process.exit(0);
  }

  const rows = [];
  const domainCounts = {};

  snap.docs.forEach((doc) => {
    const d = doc.data();
    const domain = d.domain || "Unknown";
    const difficulty = d.difficulty || "Unknown";
    const preview = truncate(d.stem || d.questionText || "", 250);
    const contentVersion = d.contentVersion || "";

    rows.push({
      id: doc.id,
      domain,
      difficulty,
      preview,
      contentVersion,
    });

    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  // Sort by domain then id for readability
  rows.sort((a, b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id));

  // Build CSV
  const header = "id,domain,difficulty,preview,contentVersion";
  const lines = rows.map(
    (r) =>
      [
        escapeCsv(r.id),
        escapeCsv(r.domain),
        escapeCsv(r.difficulty),
        escapeCsv(r.preview),
        escapeCsv(r.contentVersion),
      ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  fs.writeFileSync(OUTPUT_FILE, csv, "utf-8");

  // Summary
  console.log("── Summary ──");
  console.log(`Total exported: ${rows.length}`);
  console.log("");
  console.log("Domain breakdown:");
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
  console.log("");
  console.log(`Output: ${path.basename(OUTPUT_FILE)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
