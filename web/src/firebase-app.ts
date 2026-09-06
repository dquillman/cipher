// Firebase app + Auth + Functions, with NO Firestore import.
//
// Why this file exists: firebase.ts calls initializeFirestore at module scope,
// so ANY static import of it — even one that only wants `auth` — pulls the
// 307KB fb-firestore chunk into whatever bundle does the importing. App.tsx
// imported `auth` from there, which put Firestore in the entry chunk of every
// page load, including the landing page a logged-out visitor sees.
//
// Modules that genuinely need Firestore keep importing "./firebase", which
// re-exports everything below, so no existing consumer had to change.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from 'firebase/functions';

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
let auth: Auth;
let functions: Functions;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    functions = getFunctions(app);
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, functions };
