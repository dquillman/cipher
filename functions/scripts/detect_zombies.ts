
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// INITIALIZATION
// Try to find service account
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const PROJECT_ID = 'exam-coach-ai-platform';

console.log("DEBUG ENV:", {
    GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Initialized with serviceAccountKey.json");
} else {
    // Fallback to default (works in emulator or likely if logged in via CLI)
    // FORCE PROJECT ID
    admin.initializeApp({
        projectId: PROJECT_ID
    });
    console.log(`Initialized with default credentials for project: ${PROJECT_ID}`);
}

const db = admin.firestore();

// CONFIG
const DRY_RUN = !process.argv.includes('--heal');

async function main() {
    console.log(`\n🧟 ZOMBIE PRO DETECTOR & HEALER 🧟`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (Read-Only)' : '💊 HEALING MODE'}\n`);

    try {
        const usersSnap = await db.collection('users').get();
        const totalUsers = usersSnap.size;
        console.log(`Scanning ${totalUsers} users...\n`);

        let zombiesFound = 0;
        let healedCount = 0;
        let skippedCount = 0;

        for (const doc of usersSnap.docs) {
            const uid = doc.id;
            const data = doc.data();

            // 1. EXTRACT FIELDS
            const {
                plan,
                trial,
                trialEndsAt,
                testerOverride,
                testerGrantedAt,
                // testerExpiresAt,
                updatedAt,
                email
            } = data;

            const issues: string[] = [];

            // 2. DETECTION LOGIC

            // A. Tester Override but Trial is True (Conflict)
            if (testerOverride === true && trial === true) {
                issues.push("CONFLICT: testerOverride=true BUT trial=true");
            }

            // B. Trial True but Null Expiry (Zombie)
            // Note: If plan is 'pro' and trial is true, we expect a date.
            if (trial === true && !trialEndsAt) {
                issues.push("ZOMBIE: trial=true BUT trialEndsAt is missing/null");
            }

            // C. Pro Plan + Trial True + Null Expiry (Specific Zombie Pro)
            if (plan === 'pro' && trial === true && !trialEndsAt) {
                issues.push("ZOMBIE PRO: plan=pro, trial=true, trialEndsAt=null");
            }

            // D. Timestamp Anomaly (Manual Edit Detection)
            if (testerGrantedAt && updatedAt) {
                const grantTime = testerGrantedAt.toMillis ? testerGrantedAt.toMillis() : new Date(testerGrantedAt).getTime();
                const updateTime = updatedAt.toMillis ? updatedAt.toMillis() : new Date(updatedAt).getTime();

                // If updateTime is OLDER than grantTime, the grant didn't update the doc timestamp properly (manual edit)
                // Allow small buffer (e.g. 1 sec) for clock skew, though unlikely in same tx
                if (updateTime < (grantTime - 1000)) {
                    issues.push(`ANOMALY: updatedAt (${new Date(updateTime).toISOString()}) < testerGrantedAt (${new Date(grantTime).toISOString()})`);
                }
            } else if (testerOverride === true && !testerGrantedAt) {
                // issues.push("WARN: testerOverride=true but no grant timestamp");
            }

            // E. Missing Log Check (Optional, expensive to query every user, skipping for bulk perf unless flagged)


            // 3. REPORT & HEAL
            if (issues.length > 0) {
                zombiesFound++;
                console.log(`\n[${uid}] ${email || 'No Email'}`);
                issues.forEach(i => console.log(`   ❌ ${i}`));
                console.log(`   Context: plan=${plan}, trial=${trial}, testerOverride=${testerOverride}`);

                // DECISION LOGIC
                // Only heal if we are SURE they should be a tester
                const shouldHeal = testerOverride === true;

                if (shouldHeal) {
                    if (!DRY_RUN) {
                        console.log(`   🩹 HEALING...`);
                        await healUser(uid, data);
                        healedCount++;
                    } else {
                        console.log(`   ⚠️  WOULD HEAL (Standardizing Tester Status)`);
                    }
                } else {
                    console.log(`   ⏭️  SKIPPING HEAL (Ambiguous Intent - Not marked as tester)`);
                    skippedCount++;
                }
            }
        }

        console.log(`\n-------------------------------------------`);
        console.log(`SCAN COMPLETE.`);
        console.log(`Total Scanned: ${totalUsers}`);
        console.log(`Zombies Detected: ${zombiesFound}`);
        if (!DRY_RUN) {
            console.log(`Users Healed: ${healedCount}`);
        } else {
            console.log(`Heal Candidates: ${healedCount} (Run with --heal to apply)`);
        }
        console.log(`Skipped: ${skippedCount}`);
        console.log(`-------------------------------------------\n`);

    } catch (error) {
        console.error("Critical Error during scan:", error);
    }
}

async function healUser(uid: string, currentData: any) {
    // REPLICATE ADMIN GRANT LOGIC EXACTLY
    // Reference: functions/src/tester_management.ts

    // 14 Days from now
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    const auditRef = db.collection('admin_audit_logs').doc();

    const updates = {
        isPro: true,
        plan: 'pro',
        testerOverride: true,
        testerExpiresAt: expiresAt,
        testerGrantedAt: now,
        testerGrantedBy: 'SYSTEM_HEAL_ZOMBIE_SCRIPT',
        trial: null, // CRITICAL FIX
        updatedAt: now
    };

    batch.update(userRef, updates);

    batch.set(auditRef, {
        action: 'GRANT_TESTER_PRO',
        adminUserId: 'SYSTEM_HEAL',
        targetUserId: uid,
        details: {
            reason: 'Healed Zombie Pro State',
            previousState: {
                trial: currentData.trial,
                plan: currentData.plan,
                testerOverride: currentData.testerOverride
            },
            expiresAt
        },
        timestamp: now
    });

    await batch.commit();
    console.log(`      ✅ Healed: Set trial=null, Refreshed Grant.`);
}

main();
