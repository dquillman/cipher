
import * as admin from 'firebase-admin';
// import * as path from 'path';
// import * as fs from 'fs';

const PROJECT_ID = 'exam-coach-ai-platform';

// Force default init for emulator/environment
admin.initializeApp({ projectId: PROJECT_ID });

const db = admin.firestore();

async function main() {
    console.log("Checking last 10 users for Trial Initialization...");

    // Sort by creation time desc
    const usersSnap = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

    console.log(`Found ${usersSnap.size} users.\n`);

    usersSnap.docs.forEach(doc => {
        const data = doc.data();
        const uid = doc.id;
        const created = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 'UNKNOWN';
        const role = data.role;
        const plan = data.plan;
        const trial = data.trial;
        const trialEndsAt = data.trialEndsAt ? (data.trialEndsAt.toDate ? data.trialEndsAt.toDate().toISOString() : data.trialEndsAt) : 'NULL';

        console.log(`[${uid}] Created: ${created} (${data.email})`);
        console.log(`   Plan: ${plan}`);
        console.log(`   Trial: ${trial}`);
        console.log(`   Trial Ends: ${trialEndsAt}`);

        // Validation Logic
        let valid = true;
        if (role === 'user' && !data.testerOverride) {
            if (plan !== 'pro') {
                console.log(`   ⚠️  WARNING: Plan is '${plan}', expected 'pro' for new trial.`);
                valid = false;
            }
            if (trial !== true) {
                console.log(`   ⚠️  WARNING: Trial is '${trial}', expected true.`);
                valid = false;
            }
            if (!data.trialEndsAt) {
                console.log(`   ⚠️  WARNING: TrialEndsAt is NULL/Missing.`);
                valid = false;
            }
        }

        if (valid) console.log(`   ✅ Valid Initialization`);
        console.log('');
    });
}

main();
