
import * as admin from 'firebase-admin';
// path import removed

// Initialize Firebase Admin
// Assuming service account is available or we are using default creds in the environment
// Check if we need to load service account:
// admin.initializeApp(); 
// In some environments, it needs creds. Let's try default first.

if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (serviceAccountPath) {
            admin.initializeApp({
                credential: admin.credential.cert(require(serviceAccountPath))
            });
        } else {
            admin.initializeApp();
        }
    } catch (e) {
        console.error("Failed to init admin:", e);
        // Fallback for local dev if needed, or error out
        process.exit(1);
    }
}

const db = admin.firestore();
const COLLECTION_NAME = 'issues';

async function backfillIds(dryRun: boolean = true) {
    console.log(`Starting Issue ID Backfill (DRY RUN: ${dryRun})...`);

    const snapshot = await db.collection(COLLECTION_NAME).get();
    const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Total Issues Found: ${allDocs.length}`);

    // 1. Identify existing IDs to find the max
    let maxId = 0;
    const missingIdDocs: any[] = [];
    const existingIds: string[] = [];

    const idRegex = /^(AC|EC)-(\d+)$/;

    for (const doc of allDocs) {
        const data = doc as any;
        if (data.displayId && idRegex.test(data.displayId)) {
            existingIds.push(data.displayId);
            const match = data.displayId.match(idRegex);
            if (match) {
                const num = parseInt(match[2], 10);
                if (num > maxId) maxId = num;
            }
        } else {
            missingIdDocs.push(doc);
        }
    }

    console.log(`Issues with valid IDs: ${existingIds.length}`);
    console.log(`Issues MISSING IDs: ${missingIdDocs.length}`);
    console.log(`Current Max ID Number: ${maxId}`);

    if (missingIdDocs.length === 0) {
        console.log("No issues missing IDs. Migration complete.");
        return;
    }

    // 2. Sort missing docs by timestamp (Oldest first -> Assignments start there)
    // Note: timestamp might be a Firestore Timestamp object or date string or null.
    // We'll try to handle basic cases.
    missingIdDocs.sort((a, b) => {
        const tA = getMillis(a);
        const tB = getMillis(b);
        return tA - tB;
    });

    console.log("\n--- Proposed ID Assignments ---");

    let nextId = maxId + 1;
    const updates: { docId: string, newId: string, title?: string }[] = [];

    for (const doc of missingIdDocs) {
        const newId = `EC-${String(nextId).padStart(3, '0')}`;
        updates.push({
            docId: doc.id,
            newId: newId,
            title: doc.description ? doc.description.substring(0, 30) + '...' : '(No desc)'
        });
        nextId++;
    }

    // Preview
    updates.slice(0, 10).forEach(u => {
        console.log(`[${u.docId}] -> ${u.newId} \t(${u.title})`);
    });
    if (updates.length > 10) {
        console.log(`... and ${updates.length - 10} more.`);
    }

    if (dryRun) {
        console.log("\n[DRY RUN COMPLETE] No changes written to Firestore.");
    } else {
        console.log("\n[WRITING UPDATES]...");
        const batchSize = 400; // conservative batch limit
        let batchInfo = db.batch();
        let count = 0;
        let batchCount = 0;

        for (const update of updates) {
            const ref = db.collection(COLLECTION_NAME).doc(update.docId);
            batchInfo.update(ref, {
                displayId: update.newId,
                // optionally we could set 'migratedAt': admin.firestore.FieldValue.serverTimestamp()
            });
            count++;

            if (count >= batchSize) {
                await batchInfo.commit();
                batchCount++;
                console.log(`Committed batch ${batchCount}...`);
                batchInfo = db.batch();
                count = 0;
            }
        }
        if (count > 0) {
            await batchInfo.commit();
            console.log(`Committed final batch.`);
        }
        console.log("Migration Write Complete.");
    }
}

function getMillis(docData: any): number {
    if (docData.timestamp && typeof docData.timestamp.toMillis === 'function') {
        return docData.timestamp.toMillis();
    }
    if (docData.createdAt && typeof docData.createdAt.toMillis === 'function') {
        return docData.createdAt.toMillis();
    }
    // Backup: Date or string
    if (docData.timestamp instanceof Date) return docData.timestamp.getTime();
    if (docData.createdAt instanceof Date) return docData.createdAt.getTime();

    // Last resort: try update time or 0
    return 0;
}

// Run
const args = process.argv.slice(2);
const isDryRun = !args.includes('--write');

backfillIds(isDryRun).catch(e => console.error(e));
