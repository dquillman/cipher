/**
 * EC-113 Batch Rewrite Deployment Script
 *
 * Updates 35 PMP question stems and options in Firestore.
 * - Backs up originals to ec-113-pre-diversification-backup.json
 * - Updates only: stem, options, contentVersion
 * - Preserves ALL other fields
 * - Uses batch writes (max 500 per batch)
 * - DRY_RUN mode for safe preview
 *
 * Usage:
 *   node deploy-ec113-rewrites.js             # dry run (default)
 *   node deploy-ec113-rewrites.js --live      # live deploy
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes("--live");
const CONTENT_VERSION = "1.16.1-EC113";
const REWRITES_FILE = path.join(__dirname, "ec-113-batch-rewrites.json");
const BACKUP_FILE = path.join(__dirname, "ec-113-pre-diversification-backup.json");
const COLLECTION = "questions";

// ── Init ────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ projectId: "exam-coach-ai-platform" });
}
console.log("Project:", admin.app().options.projectId);
console.log("Mode:", DRY_RUN ? "DRY RUN (no writes)" : "LIVE DEPLOY");
console.log("");

const db = admin.firestore();

async function main() {
  // 1. Load rewrites
  if (!fs.existsSync(REWRITES_FILE)) {
    console.error("Rewrites file not found:", REWRITES_FILE);
    process.exit(1);
  }
  const rewrites = JSON.parse(fs.readFileSync(REWRITES_FILE, "utf-8"));
  console.log(`Loaded ${rewrites.length} rewrites from ${path.basename(REWRITES_FILE)}`);

  // 2. Fetch and back up originals
  console.log("\n── Backing up originals ──");
  const backups = [];
  const missing = [];

  for (const r of rewrites) {
    const docRef = db.collection(COLLECTION).doc(r.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      missing.push(r.id);
      console.error(`  MISSING: ${r.id}`);
    } else {
      backups.push({ id: r.id, ...snap.data() });
      console.log(`  Backed up: ${r.id}`);
    }
  }

  // Abort if any ID not found
  if (missing.length > 0) {
    console.error(`\nABORTING: ${missing.length} document(s) not found in Firestore.`);
    console.error("Missing IDs:", missing);
    process.exit(1);
  }

  // Write backup file
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backups, null, 2));
  console.log(`\nBackup written: ${path.basename(BACKUP_FILE)} (${backups.length} docs)`);

  // 3. Apply updates
  if (DRY_RUN) {
    console.log("\n── DRY RUN — Preview ──");
    for (const r of rewrites) {
      const original = backups.find((b) => b.id === r.id);
      const stemChanged = original.stem !== r.stem;
      const optsChanged = JSON.stringify(original.options) !== JSON.stringify(r.options);
      const explChanged = r.explanation && original.explanation !== r.explanation;
      console.log(
        `  ${r.id}: stem ${stemChanged ? "CHANGED" : "same"}, options ${optsChanged ? "CHANGED" : "same"}${explChanged ? ", explanation CHANGED" : ""}`
      );
    }
    console.log(`\nDry run complete. ${rewrites.length} docs would be updated.`);
    console.log("Run with --live to deploy.");
    return;
  }

  console.log("\n── Deploying updates ──");
  const BATCH_LIMIT = 500;
  let batch = db.batch();
  let batchCount = 0;
  let totalUpdated = 0;
  let errors = 0;

  for (const r of rewrites) {
    try {
      const docRef = db.collection(COLLECTION).doc(r.id);
      const updateData = {
        stem: r.stem,
        options: r.options,
        contentVersion: CONTENT_VERSION,
      };
      if (r.explanation) {
        updateData.explanation = r.explanation;
      }
      batch.update(docRef, updateData);
      batchCount++;
      totalUpdated++;

      // Commit if batch is full
      if (batchCount >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`  Committed batch (${batchCount} docs)`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (err) {
      errors++;
      console.error(`  ERROR updating ${r.id}:`, err.message);
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch (${batchCount} docs)`);
  }

  // 4. Summary
  console.log("\n── Summary ──");
  console.log(`  Docs backed up:  ${backups.length}`);
  console.log(`  Docs updated:    ${totalUpdated}`);
  console.log(`  Errors:          ${errors}`);
  console.log(`  Content version: ${CONTENT_VERSION}`);
  console.log(`  Backup file:     ${path.basename(BACKUP_FILE)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
