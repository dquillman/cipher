import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function clean() {
    console.log("Cleaning questions collection...");
    const questionsRef = collection(db, "questions");
    const snapshot = await getDocs(questionsRef);

    if (snapshot.empty) {
        console.log("No questions found to delete.");
        return;
    }

    console.log(`Found ${snapshot.size} questions. Deleting...`);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "questions", d.id)));
    await Promise.all(deletePromises);
    console.log("All questions deleted.");
}

clean();
