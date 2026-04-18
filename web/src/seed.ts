import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { DEFAULT_EXAM_ID } from "./config/exams";
import type { BloomLevel } from "./types/Bloom";

/**
 * Every seeded question MUST include bloomLevel. The type below enforces it.
 * If you add a question without classifying it, either:
 *   - Pick the level yourself using src/types/Bloom.ts descriptions, or
 *   - Run the backfill pipeline: functions/classify-blooms.js + writeback-blooms.js
 */
interface SeedQuestion {
    type?: string;
    stem: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    domain: string;
    examId: string;
    difficulty: string;
    bloomLevel: BloomLevel;
    scenarios?: { label: string; probability: number; impact: number }[];
    correctLabel?: string;
}

const DEFAULT_EXAM_FIRESTORE_ID = DEFAULT_EXAM_ID;

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
// connectFirestoreEmulator(db, 'localhost', 8080);

const sampleQuestions: SeedQuestion[] = [
    {
        stem: "Which of the following is a key output of the 'Direct and Manage Project Work' process?",
        options: ["Work performance data", "Project management plan", "Accepted deliverables", "Change requests"],
        correctAnswer: 0,
        explanation: "Work performance data is a key output, representing raw observations and measurements identified during activities being performed to carry out the project work.",
        domain: "Process",
        examId: DEFAULT_EXAM_FIRESTORE_ID,
        difficulty: "Medium",
        bloomLevel: "Remember"
    },
    {
        stem: "A team member is constantly late to meetings and not completing tasks on time. What is the best conflict resolution technique to use?",
        options: ["Smooth/Accommodate", "Force/Direct", "Collaborate/Problem Solve", "Withdraw/Avoid"],
        correctAnswer: 2,
        explanation: "Collaborate/Problem Solve is the best approach to understand the root cause of the behavior and find a long-term solution.",
        domain: "People",
        examId: DEFAULT_EXAM_FIRESTORE_ID,
        difficulty: "Hard",
        bloomLevel: "Apply"
    },
    {
        stem: "What is the primary purpose of the 'Develop Project Charter' process?",
        options: ["To define the detailed project scope", "To formally authorize the project", "To identify all stakeholders", "To create the project budget"],
        correctAnswer: 1,
        explanation: "The Project Charter formally authorizes the existence of the project and provides the project manager with the authority to apply organizational resources to project activities.",
        domain: "Process",
        examId: DEFAULT_EXAM_FIRESTORE_ID,
        difficulty: "Easy",
        bloomLevel: "Understand"
    },
    {
        stem: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        explanation: "Paris is the capital and most populous city of France.",
        domain: "Business Environment",
        examId: DEFAULT_EXAM_FIRESTORE_ID,
        difficulty: "Easy",
        bloomLevel: "Remember"
    },
    {
        type: "emv",
        stem: "A project manager is evaluating two strategies for a critical component. Outsource manufacturing has a 60% probability of saving $50,000. Building an in-house factory has a 30% probability of saving $120,000. Which strategy has the higher expected monetary value?",
        options: ["Outsource manufacturing", "Build in-house factory"],
        correctAnswer: 1,
        explanation: "Note: When comparing strategies using EMV, always multiply each option's probability by its monetary impact. The option with the highest EMV represents the best expected outcome based on the available data. This is a core PMI decision-analysis technique from the PMBOK Guide.",
        domain: "Process",
        examId: DEFAULT_EXAM_FIRESTORE_ID,
        scenarios: [
            { label: "Outsource manufacturing", probability: 0.6, impact: 50000 },
            { label: "Build in-house factory", probability: 0.3, impact: 120000 }
        ],
        correctLabel: "Build in-house factory",
        difficulty: "Medium",
        bloomLevel: "Apply"
    }
];

async function seed() {
    console.log("Seeding questions...");
    let i = 1;
    for (const q of sampleQuestions) {
        const id = `question_${i++}`;
        await setDoc(doc(db, "questions", id), q);
        console.log(`Added question ${id}: ${q.stem.substring(0, 20)}...`);
    }
    console.log("Done!");
}

seed();
