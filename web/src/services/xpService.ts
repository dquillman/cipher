import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

export interface UserGamificationData {
    xp: number;
    level: number;
    badges: string[];
    streak: number;
    lastActivityDate: string; // ISO date string YYYY-MM-DD
}

export const XPService = {
    // Level Curve: Level = floor(sqrt(XP / 100)) + 1
    // Lvl 1: 0-99 XP
    // Lvl 2: 100-399 XP
    // Lvl 3: 400-899 XP
    calculateLevel: (xp: number) => {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    },

    calculateNextLevelXp: (level: number) => {
        return Math.pow(level, 2) * 100;
    },

    /**
     * Awards XP to the current user and checks for Level Up.
     */
    /**
     * Awards XP to the user for a specific exam.
     * Tracks both Global XP (for user profile) and Exam-Specific XP (for exam level).
     */
    awardXP: async (amount: number, reason: string, examId?: string) => {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);

        try {
            const snap = await getDoc(userRef);
            let currentGlobalXp = 0;
            let currentExamXp = 0;

            if (snap.exists()) {
                const data = snap.data();
                currentGlobalXp = data.xp || 0;
                if (examId && data.examXP && data.examXP[examId]) {
                    currentExamXp = data.examXP[examId];
                }
            }

            const newGlobalXp = currentGlobalXp + amount;
            const newExamXp = currentExamXp + amount;

            const oldGlobalLevel = XPService.calculateLevel(currentGlobalXp);
            const newGlobalLevel = XPService.calculateLevel(newGlobalXp);

            // If examId is present, we track that level change for the return value
            const oldExamLevel = XPService.calculateLevel(currentExamXp);
            const newExamLevel = XPService.calculateLevel(newExamXp);

            const updates: any = {
                xp: increment(amount), // Always track global
                level: newGlobalLevel
            };

            // Track Exam Specific XP if provided
            if (examId) {
                updates[`examXP.${examId}`] = increment(amount);
            }

            await setDoc(userRef, updates, { merge: true });

            console.log(`Awarded ${amount} XP for "${reason}". Global: ${newGlobalXp} (Lvl ${newGlobalLevel}). Exam: ${newExamXp} (Lvl ${newExamLevel})`);

            return {
                leveledUp: examId ? newExamLevel > oldExamLevel : newGlobalLevel > oldGlobalLevel,
                newLevel: examId ? newExamLevel : newGlobalLevel,
                earnedXp: amount
            };
        } catch (error) {
            console.error("Error awarding XP:", error);
            return null;
        }
    },

    /**
     * Checks and updates streak. Should be called once per daily session.
     */
    checkStreak: async () => {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);

        const today = new Date().toISOString().split('T')[0];

        try {
            const snap = await getDoc(userRef);
            if (!snap.exists()) return;

            const data = snap.data();
            const lastDate = data.lastActivityDate;
            const currentStreak = data.streak || 0;

            if (lastDate === today) {
                // Already counted for today
                return;
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = 1;
            if (lastDate === yesterdayStr) {
                newStreak = currentStreak + 1;
            } else {
                // Streak broken (or first time)
                newStreak = 1;
            }

            await updateDoc(userRef, {
                streak: newStreak,
                lastActivityDate: today
            });

            console.log(`Streak updated to ${newStreak}`);

        } catch (error) {
            console.error("Error updating streak:", error);
        }
    }
};
