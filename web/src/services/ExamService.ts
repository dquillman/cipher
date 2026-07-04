import { db } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';

export interface ExamSummary {
    id: string;
    name: string;
}

export const ExamService = {
    /**
     * Fetches published exams, sorted by name.
     */
    fetchPublishedExams: async (): Promise<ExamSummary[]> => {
        // Filter for published exams only
        const q = query(collection(db, 'exams'), where('isPublished', '==', true));
        const snapshot = await getDocs(q);

        const exams = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Unnamed Exam'
        }));
        exams.sort((a, b) => a.name.localeCompare(b.name));
        return exams;
    },
};
