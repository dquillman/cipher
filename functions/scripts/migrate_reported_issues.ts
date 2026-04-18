
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (serviceAccountPath) {
            admin.initializeApp({
                credential: admin.credential.cert(require(serviceAccountPath)),
                projectId: 'exam-coach-ai-platform'
            });
        } else {
            admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
        }
    } catch (e) {
        console.error("Failed to init admin:", e);
        process.exit(1);
    }
}

const db = admin.firestore();
const SOURCE_COLLECTION = 'reported_issues';
const TARGET_COLLECTION = 'issues';

async function migrateIssues(dryRun: boolean = true) {
    console.log("Active Project ID:", admin.app().options.projectId);
    const collections = await db.listCollections();
    console.log("Available Collections:", collections.map(c => c.id).join(', '));

    console.log(`Starting Migration: ${SOURCE_COLLECTION} -> ${TARGET_COLLECTION} (DRY RUN: ${dryRun})`);

    // 1. Fetch Source Docs
    const sourceSnapshot = await db.collection(SOURCE_COLLECTION).get();
    const sourceDocs = sourceSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    // 2. Fetch Target Docs (to check for duplicates/existing IDs)
    const targetSnapshot = await db.collection(TARGET_COLLECTION).get();
    const targetDocs = targetSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    console.log(`Source Docs: ${sourceDocs.length}`);
    console.log(`Target Docs: ${targetDocs.length}`);

    // 3. Determine Max ID
    let maxId = 0;
    const idRegex = /^(AC|EC)-(\d+)$/;
    targetDocs.forEach(d => {
        if (d.displayId && idRegex.test(d.displayId)) {
            const match = d.displayId.match(idRegex);
            if (match) {
                const num = parseInt(match[2], 10);
                if (num > maxId) maxId = num;
            }
        }
    });
    console.log(`Current Max ID in Target: ${maxId}`);

    // 4. Identify docs to migrate
    // We check if a doc with 'legacyId' == source.id exists in target
    // OR if we want to be naive, strictly those not present.
    // Let's assume we store source.id as 'legacyId' in target.

    // Also skip if target already has same Description + CreatedAt? 
    // For safety, let's map by legacyId if possible, or just look for matching content.
    // Given the prompt implies migrating "ALL legacy issues", we'll filter out ones that seem to be there.
    // Since 'issues' collection is likely new or empty (as per previous step), we might mock migrating all.

    const docsToMigrate: any[] = [];

    for (const sDoc of sourceDocs) {
        // Check if already migrated
        const alreadyExists = targetDocs.find(t => t.legacyId === sDoc.id || (t.description === sDoc.description && t.userEmail === sDoc.userEmail));
        if (!alreadyExists) {
            docsToMigrate.push(sDoc);
        }
    }

    if (docsToMigrate.length === 0) {
        console.log("No new documents to migrate.");
        return;
    }

    // 5. Sort by creation time
    docsToMigrate.sort((a, b) => {
        const tA = getMillis(a);
        const tB = getMillis(b);
        return tA - tB;
    });

    console.log(`Docs to Migrate: ${docsToMigrate.length}`);

    // 6. Map to new objects
    let nextId = maxId + 1;
    const batchOps: any[] = [];

    console.log("\n--- Preview Mapping ---");

    for (const doc of docsToMigrate) {
        const newId = `EC-${String(nextId).padStart(3, '0')}`;

        // Map fields
        const newDoc = {
            description: doc.description || doc.text || '', // Handle varied source fields
            path: doc.path || doc.route || 'unknown',
            userEmail: doc.userEmail || doc.email || 'anonymous',
            userId: doc.userId || doc.uid || 'anonymous',
            timestamp: doc.timestamp || doc.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            createdAt: doc.createdAt || doc.timestamp || new Date(), // Keep original creation date

            // New Governance Fields
            displayId: newId,
            severity: 'Medium', // Default S2
            status: 'Open',    // Default New
            // classification: undefined, // Default Needs Class
            // editType: undefined, // Default Unknown

            legacyId: doc.id,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'bug', // Default type
            version: '1.0'
        };

        batchOps.push({
            legacyId: doc.id,
            newId: newId,
            data: newDoc
        });
        nextId++;
    }

    // Preview 10
    batchOps.slice(0, 10).forEach(op => {
        console.log(`[${op.legacyId}] -> ${op.newId} | ${op.data.description.substring(0, 40)}...`);
    });
    if (batchOps.length > 10) console.log(`... and ${batchOps.length - 10} more.`);

    // 7. Write
    if (dryRun) {
        console.log("\n[DRY RUN COMPLETE] No changes written.");
    } else {
        console.log("\n[WRITING MIGRATION]...");
        const batchSize = 400;
        let batchInfo = db.batch();
        let count = 0;
        let batchCount = 0;

        for (const op of batchOps) {
            const newRef = db.collection(TARGET_COLLECTION).doc(); // Auto-ID for the doc itself, but field has displayId
            batchInfo.set(newRef, op.data);
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
    if (docData.timestamp && typeof docData.timestamp.toMillis === 'function') return docData.timestamp.toMillis();
    if (docData.createdAt && typeof docData.createdAt.toMillis === 'function') return docData.createdAt.toMillis();
    if (docData.timestamp instanceof Date) return docData.timestamp.getTime();
    if (docData.createdAt instanceof Date) return docData.createdAt.getTime();
    if (docData.created && typeof docData.created.toMillis === 'function') return docData.created.toMillis();
    return 0;
}

const args = process.argv.slice(2);
const isDryRun = !args.includes('--write');

migrateIssues(isDryRun).catch(e => console.error(e));
