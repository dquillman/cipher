import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function checkMastery() {
    console.log("Checking userMastery collection...");
    const masteryRef = collection(db, "userMastery");
    const snapshot = await getDocs(masteryRef);

    if (snapshot.empty) {
        console.log("No mastery data found.");
        return;
    }

    console.log(`Found ${snapshot.size} mastery documents:`);
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

checkMastery();
