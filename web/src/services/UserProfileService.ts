import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const UserProfileService = {
    /**
     * Fetches the user's role from their Firestore profile. Defaults to 'user'.
     */
    getUserRole: async (uid: string): Promise<string> => {
        const profileDoc = await getDoc(doc(db, 'users', uid));
        if (profileDoc.exists()) {
            return profileDoc.data()?.role || 'user';
        }
        return 'user';
    },
};
