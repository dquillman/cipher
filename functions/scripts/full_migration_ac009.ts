
import * as admin from 'firebase-admin';

const PROJECT_ID = 'exam-coach-ai-platform';
const DRY_RUN = false; // STRICT WRITE MODE

// Initialize Firebase Admin with explicit Project ID
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (serviceAccountPath) {
            admin.initializeApp({
                credential: admin.credential.cert(require(serviceAccountPath)),
                projectId: PROJECT_ID
            });
        } else {
            admin.initializeApp({ projectId: PROJECT_ID });
        }
    } catch (e) {
        console.error("Failed to init admin:", e);
        process.exit(1);
    }
}

const db = admin.firestore();
const TARGET_COLLECTION = 'issues';
const SOURCE_COLLECTION = 'reported_issues'; // Legacy

async function runMigration() {
    console.log(`[AC-009] Starting Full Migration (Option B)`);
    console.log(`Target Project: ${admin.app().options.projectId}`);

    // Safety Check
    if (admin.app().options.projectId !== PROJECT_ID) {
        console.error(`CRITICAL ERROR: Project ID mismatch. Expected ${PROJECT_ID}`);
        process.exit(1);
    }

    // --- PHASE A: Backfill Existing Issues ---
    console.log("\n--- Phase A: Backfill Existing 'issues' ---");
    const issuesSnapshot = await db.collection(TARGET_COLLECTION).get();
    const existingIssues = issuesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    // Sort by createdAt
    existingIssues.sort((a, b) => getMillis(a) - getMillis(b));

    console.log(`Found ${existingIssues.length} existing issues.`);

    let nextId = 1;
    const batchUpdates: any[] = [];

    // Track assigned IDs to avoid duplicates if any exist
    const assignedIds = new Set<string>();

    for (const doc of existingIssues) {
        let docId = doc.displayId;
        let needsUpdate = false;
        const updatePayload: any = {};

        // 1. Assign ID if missing
        if (!docId || !docId.startsWith('EC-')) {
            docId = `EC-${String(nextId).padStart(3, '0')}`;
            updatePayload.displayId = docId;
            nextId++;
            needsUpdate = true;
        } else {
            // Respect existing valid IDs and increment counter past them if needed
            // (Assuming sequential integer part)
            const match = docId.match(/EC-(\d+)/);
            if (match) {
                const curentNum = parseInt(match[1], 10);
                if (curentNum >= nextId) nextId = curentNum + 1;
            }
        }

        assignedIds.add(docId);

        // 2. Backfill Governance Fields
        if (!doc.severity) { updatePayload.severity = 'Medium'; needsUpdate = true; } // Default S2 -> Medium
        if (!doc.classification) { updatePayload.classification = 'Needs Class'; needsUpdate = true; }
        if (!doc.editType) { updatePayload.editType = 'Unknown'; needsUpdate = true; }
        if (!doc.status) { updatePayload.status = 'Open'; needsUpdate = true; } // Default New -> Open

        if (needsUpdate) {
            batchUpdates.push({
                ref: db.collection(TARGET_COLLECTION).doc(doc.id),
                data: updatePayload,
                displayId: docId
            });
        }
    }

    console.log(`Phase A: ${batchUpdates.length} updates prepared.`);

    // --- PHASE B: Migrate Legacy Issues ---
    console.log("\n--- Phase B: Migrate 'reported_issues' ---");
    const legacySnapshot = await db.collection(SOURCE_COLLECTION).get();
    const legacyIssues = legacySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    // Sort
    legacyIssues.sort((a, b) => getMillis(a) - getMillis(b));
    console.log(`Found ${legacyIssues.length} legacy issues.`);

    const batchCreates: any[] = [];

    for (const doc of legacyIssues) {
        // Idempotency Check: Look for legacyId in target docs
        const alreadyMigrated = existingIssues.find(e => e.legacyId === doc.id);
        if (alreadyMigrated) {
            console.log(`Skipping legacy doc ${doc.id} (Always exists as ${alreadyMigrated.displayId})`);
            continue;
        }

        const newId = `EC-${String(nextId).padStart(3, '0')}`;
        nextId++;

        const newDocPayload = {
            // Mapped Fields
            description: doc.description || doc.text || '(No content)',
            path: doc.path || doc.route || 'unknown',
            userEmail: doc.userEmail || doc.email || 'anonymous',
            userId: doc.userId || doc.uid || 'anonymous',
            timestamp: doc.timestamp || doc.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            createdAt: doc.createdAt || doc.timestamp || new Date(),

            // Governance
            displayId: newId,
            severity: 'Medium',
            classification: 'Needs Class',
            editType: 'Unknown',
            status: 'Open',

            // Metadata
            legacyId: doc.id,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'bug',
            version: '1.0'
        };

        batchCreates.push({
            ref: db.collection(TARGET_COLLECTION).doc(), // Auto-ID
            data: newDocPayload,
            displayId: newId
        });
    }

    console.log(`Phase B: ${batchCreates.length} new migrations prepared.`);

    // --- EXECUTION ---
    console.log("\n--- EXECUTION REPORT ---");
    console.log(`Firebase Project ID: ${PROJECT_ID}`);
    console.log(`Issues Backfilled: ${batchUpdates.length}`);
    console.log(`Issues Migrated: ${batchCreates.length}`);

    const allOps = [...batchUpdates, ...batchCreates];
    if (allOps.length > 0) {
        console.log("First 10 Assignments:");
        allOps.slice(0, 10).forEach(op => {
            console.log(` -> ${op.displayId}`);
        });
        if (allOps.length > 0) {
            console.log(`Last Assignment: ${allOps[allOps.length - 1].displayId}`);
        }
    } else {
        console.log("No changes required.");
    }

    if (DRY_RUN) {
        console.log("\n[DRY RUN] No writes performed.");
        return;
    }

    // Commit Batches
    let batch = db.batch();
    let counter = 0;

    for (const op of batchUpdates) {
        batch.update(op.ref, op.data);
        counter++;
        if (counter >= 400) { await batch.commit(); batch = db.batch(); counter = 0; }
    }

    for (const op of batchCreates) {
        batch.set(op.ref, op.data);
        counter++;
        if (counter >= 400) { await batch.commit(); batch = db.batch(); counter = 0; }
    }

    if (counter > 0) await batch.commit();

    console.log("\n[SUCCESS] Migration Write Complete.");

    // Verify Final Count
    const finalCount = (await db.collection(TARGET_COLLECTION).count().get()).data().count;
    console.log(`Final 'issues' Count: ${finalCount}`);
}

function getMillis(docData: any): number {
    if (docData.timestamp && typeof docData.timestamp.toMillis === 'function') return docData.timestamp.toMillis();
    if (docData.createdAt && typeof docData.createdAt.toMillis === 'function') return docData.createdAt.toMillis();
    if (docData.timestamp instanceof Date) return docData.timestamp.getTime();
    if (docData.createdAt instanceof Date) return docData.createdAt.getTime();
    return 0;
}

runMigration().catch(console.error);
