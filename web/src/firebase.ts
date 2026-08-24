import { initializeApp, type FirebaseApp } from "firebase/app";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    type Firestore,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from 'firebase/functions';
// NOTE: firebase/analytics and firebase/performance were removed on purpose.
// GA4 is already loaded via gtag in index.html with the same measurement ID,
// so the Analytics SDK was double-tracking — and together with Performance it
// pulled ~30KB gz + an Installations network round-trip into EVERY page load.
// firebase/storage is imported lazily by the one component that uses it
// (ReportIssueModal) so it stays out of the entry bundle.

const firebaseConfig = {
    apiKey: "AIzaSyBBlyZqdAJw_yNNfUQfVW59eYgkrBJLUCQ",
    authDomain: "exam-coach-ai-platform.firebaseapp.com",
    projectId: "exam-coach-ai-platform",
    storageBucket: "exam-coach-ai-platform.firebasestorage.app",
    messagingSenderId: "980138578480",
    appId: "1:980138578480:web:f796be8a414d778a6bd3f5",
    measurementId: "G-HY0QBN84Y6"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;

try {
    app = initializeApp(firebaseConfig);

    // Persist Firestore to IndexedDB instead of re-fetching from the network
    // on every page load.
    //
    // Why this matters: Quiz.tsx loads the whole question bank for the active
    // exam to run its SRS selection client-side — 194 docs / ~323KB for PMP
    // v2026. With the default memory-only cache that download repeated on
    // EVERY quiz start, including a returning user's second and third session.
    // 87 quiz loads have been logged over 5s (median 8.4s, worst 293s), and
    // slow_load fires on the quiz page and nowhere else in the app.
    //
    // With persistence the bank is served from disk and only genuinely changed
    // documents come down the wire, so repeat loads stop paying that cost.
    // persistentMultipleTabManager keeps it correct when a user has the app
    // open in more than one tab.
    //
    // Persistence is best-effort: it throws in private-browsing modes and on
    // browsers without IndexedDB. A cache is an optimisation, never a
    // prerequisite, so fall back to the in-memory default rather than leaving
    // the app with no Firestore at all.
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch (cacheError) {
        console.warn('Firestore persistence unavailable, using memory cache:', cacheError);
        db = getFirestore(app);
    }

    auth = getAuth(app);
    functions = getFunctions(app);

    // if (location.hostname === "localhost") {
    //     connectFirestoreEmulator(db, 'localhost', 8080);
    //     connectAuthEmulator(auth, 'http://localhost:9099');
    //     connectFunctionsEmulator(functions, 'localhost', 5001);
    //     console.log("Connected to Firebase Emulators");
    // }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider, functions };
