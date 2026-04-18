const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

async function main() {
    const all = await db.collection('users').get();
    console.log('Total users:', all.size);
    console.log('');

    all.docs.forEach(doc => {
        const d = doc.data();
        const isComped = d.billingStatus === 'comped';
        const hasTesterFields = d.testerOverride === true || d.role === 'tester';
        if (isComped || hasTesterFields) {
            console.log('=== COMPED/TESTER USER ===');
            console.log('UID:', doc.id);
            console.log('Email:', d.email);
            console.log('plan:', d.plan, '| isPro:', d.isPro, '| trial:', d.trial);
            console.log('testerOverride:', d.testerOverride, '| trialActive:', d.trialActive);
            console.log('trialEndsAt:', d.trialEndsAt, '| testerExpiresAt:', d.testerExpiresAt);
            console.log('billingStatus:', d.billingStatus, '| billingSource:', d.billingSource);
            console.log('accessLevel:', d.accessLevel, '| role:', d.role);
            console.log('');
        }
    });

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
