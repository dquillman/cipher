/**
 * Deploy Structural Final Pass
 *
 * Updates 15 Multi-Team template questions in-place with
 * new stems, options, explanations, and contentVersion.
 *
 * - Backs up originals to structural-final-pass-backup.json
 * - Updates: stem, options, explanation, contentVersion
 * - Preserves ALL other fields (correctAnswer, domain, difficulty, examId, etc.)
 * - Uses batch writes (max 500 per batch)
 * - DRY_RUN mode for safe preview
 *
 * Usage:
 *   node deploy-structural-final.js            # dry run (default)
 *   node deploy-structural-final.js --live     # live deploy
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes("--live");
const CONTENT_VERSION = "1.17.1-STRUCTURAL-FINAL";
const REWRITES_FILE = path.join(__dirname, "structural-final-pass.json");
const BACKUP_FILE = path.join(__dirname, "structural-final-pass-backup.json");
const COLLECTION = "questions";

// ── Init ────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ projectId: "exam-coach-ai-platform" });
}
console.log("Project:", admin.app().options.projectId);
console.log("Mode:", DRY_RUN ? "DRY RUN (no writes)" : "LIVE DEPLOY");
console.log("Content version:", CONTENT_VERSION);
console.log("");

const db = admin.firestore();

async function main() {
  // 1. Load rewrites
  if (!fs.existsSync(REWRITES_FILE)) {
    console.error("Rewrites file not found:", REWRITES_FILE);
    process.exit(1);
  }
  const rewrites = JSON.parse(fs.readFileSync(REWRITES_FILE, "utf-8"));
  console.log("Loaded " + rewrites.length + " rewrites from " + path.basename(REWRITES_FILE));

  // 2. Fetch and back up originals
  console.log("\n── Backing up originals ──");
  const backups = [];
  const missing = [];

  for (const r of rewrites) {
    const docRef = db.collection(COLLECTION).doc(r.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      missing.push(r.id);
      console.error("  MISSING: " + r.id);
    } else {
      backups.push({ id: r.id, ...snap.data() });
      console.log("  Backed up: " + r.id);
    }
  }

  // Abort if any ID not found
  if (missing.length > 0) {
    console.error("\nABORTING: " + missing.length + " document(s) not found in Firestore.");
    console.error("Missing IDs:", missing);
    process.exit(1);
  }

  // Write backup file
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backups, null, 2));
  console.log("\nBackup written: " + path.basename(BACKUP_FILE) + " (" + backups.length + " docs)");

  // 3. Preview or deploy
  if (DRY_RUN) {
    console.log("\n── DRY RUN — Preview ──");
    for (const r of rewrites) {
      const original = backups.find(function (b) { return b.id === r.id; });
      const stemChanged = original.stem !== r.stem;
      const optsChanged = JSON.stringify(original.options) !== JSON.stringify(r.options);
      const explChanged = original.explanation !== r.explanation;
      console.log(
        "  " + r.id + " [" + r.targetBucket + "]: stem " +
        (stemChanged ? "CHANGED" : "same") +
        ", options " + (optsChanged ? "CHANGED" : "same") +
        ", explanation " + (explChanged ? "CHANGED" : "same")
      );
    }
    console.log("\nDry run complete. " + rewrites.length + " docs would be updated.");
    console.log("Run with --live to deploy.");
    return;
  }

  // 4. Deploy updates
  console.log("\n── Deploying updates ──");
  var batch = db.batch();
  var batchCount = 0;
  var totalUpdated = 0;
  var errors = 0;

  for (const r of rewrites) {
    try {
      const docRef = db.collection(COLLECTION).doc(r.id);
      batch.update(docRef, {
        stem: r.stem,
        options: r.options,
        explanation: r.explanation,
        contentVersion: CONTENT_VERSION,
      });
      batchCount++;
      totalUpdated++;

      if (batchCount >= 500) {
        await batch.commit();
        console.log("  Committed batch (" + batchCount + " docs)");
        batch = db.batch();
        batchCount = 0;
      }
    } catch (err) {
      errors++;
      console.error("  ERROR updating " + r.id + ": " + err.message);
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log("  Committed final batch (" + batchCount + " docs)");
  }

  // 5. Verify updates
  console.log("\n── Verifying updates ──");
  var verified = 0;
  for (const r of rewrites) {
    const snap = await db.collection(COLLECTION).doc(r.id).get();
    const data = snap.data();
    if (data.contentVersion === CONTENT_VERSION && data.stem === r.stem) {
      verified++;
    } else {
      console.error("  VERIFY FAILED: " + r.id);
    }
  }

  // 6. Summary
  var examId = "7qmPagj9A6RpkC0CwGkY";
  var allSnap = await db.collection(COLLECTION).where("examId", "==", examId).get();

  console.log("\n══════════════════════════════════════");
  console.log("  STRUCTURAL FINAL PASS DEPLOY SUMMARY");
  console.log("══════════════════════════════════════");
  console.log("  Docs backed up:   " + backups.length);
  console.log("  Docs updated:     " + totalUpdated);
  console.log("  Docs verified:    " + verified + "/" + rewrites.length);
  console.log("  Errors:           " + errors);
  console.log("  Content version:  " + CONTENT_VERSION);
  console.log("  Total active:     " + allSnap.size + " (examId=" + examId + ")");
  console.log("  Backup file:      " + path.basename(BACKUP_FILE));
  console.log("══════════════════════════════════════");

  // Distribution breakdown
  var bucketCounts = {};
  rewrites.forEach(function (r) {
    bucketCounts[r.targetBucket] = (bucketCounts[r.targetBucket] || 0) + 1;
  });
  console.log("\n  Bucket distribution:");
  Object.keys(bucketCounts).sort().forEach(function (b) {
    console.log("    " + b + ": " + bucketCounts[b]);
  });
}

main()
  .then(function () { process.exit(0); })
  .catch(function (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  });
