const admin = require('firebase-admin');

// Initialize with service account or application default credentials
// If using service account: place serviceAccountKey.json in project root
try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Initialized with service account');
} catch (e) {
    // Fallback to application default credentials (works in Cloud Shell, GCE, etc.)
    admin.initializeApp();
    console.log('✅ Initialized with application default credentials');
}

const db = admin.firestore();

/**
 * Backfill user profiles for existing users
 * Creates a profile document for any user that doesn't have one
 */
async function backfillProfiles() {
    console.log('Starting backfill of user profiles...\n');

    try {
        // Get all users from Firebase Auth
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users;

        console.log(`Found ${users.length} users in Firebase Auth`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // Check if profile already exists
                const profileRef = db.collection('users').doc(user.uid);
                const profileDoc = await profileRef.get();

                if (profileDoc.exists) {
                    console.log(`⏭️  Skipped ${user.email} (profile exists)`);
                    skipped++;
                    continue;
                }

                // Create profile with default role
                await profileRef.set({
                    email: user.email,
                    displayName: user.displayName || null,
                    photoURL: user.photoURL || null,
                    role: 'user', // Default role
                    createdAt: admin.firestore.Timestamp.fromDate(new Date(user.metadata.creationTime)),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`✅ Created profile for ${user.email}`);
                created++;

            } catch (error) {
                console.error(`❌ Error creating profile for ${user.email}:`, error.message);
                errors++;
            }
        }

        console.log('\n=== Backfill Complete ===');
        console.log(`Created: ${created}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Errors: ${errors}`);
        console.log(`Total: ${users.length}`);

    } catch (error) {
        console.error('Fatal error during backfill:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run the backfill
backfillProfiles();
