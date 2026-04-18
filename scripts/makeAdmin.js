const admin = require('firebase-admin');

// Initialize with service account or application default credentials
try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Initialized with service account');
} catch (e) {
    admin.initializeApp();
    console.log('✅ Initialized with application default credentials');
}

const db = admin.firestore();

/**
 * Make a user an admin by email
 * Usage: node scripts/makeAdmin.js <email>
 */
async function makeAdmin(email) {
    if (!email) {
        console.error('❌ Error: Email is required');
        console.log('Usage: node scripts/makeAdmin.js <email>');
        process.exit(1);
    }

    try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        // Update profile with admin role
        await db.collection('users').doc(uid).set({
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Success! ${email} (${uid}) is now an admin`);

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌ Error: No user found with email ${email}`);
        } else {
            console.error(`❌ Error: ${error.message}`);
        }
        process.exit(1);
    }

    process.exit(0);
}

// Get email from command line
const email = process.argv[2];
makeAdmin(email);
