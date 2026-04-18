import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyBBlyZqdAJw_yNNfUQfVW59eYgkrBJLUCQ",
    authDomain: "exam-coach-ai-platform.firebaseapp.com",
    projectId: "exam-coach-ai-platform",
    storageBucket: "exam-coach-ai-platform.firebasestorage.app",
    messagingSenderId: "980138578480",
    appId: "1:980138578480:web:f796be8a414d778a6bd3f5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read questions from JSON file
const questionsPath = path.join(__dirname, '../src/ai_questions.json');
const rawData = fs.readFileSync(questionsPath, 'utf-8');
const questions = JSON.parse(rawData);

async function seed() {
    console.log(`Seeding ${questions.length} AI questions...`);
    const questionsRef = collection(db, "questions");

    let count = 0;
    for (const q of questions) {
        // Add examId if missing
        const questionData = {
            ...q,
            examId: "default-exam"
        };

        try {
            const docRef = await addDoc(questionsRef, questionData);
            console.log(`Added question ${docRef.id}: ${q.stem.substring(0, 30)}...`);
            count++;
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
    console.log(`Successfully added ${count} questions!`);
}

seed();
