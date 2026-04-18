import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { User as UserIcon, Shield, LayoutGrid } from 'lucide-react';

/**
 * IdentityIndicator Component (User App)
 * Displays the logged-in user's email and role.
 */
export default function IdentityIndicator() {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const db = getFirestore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    // Fetch role from Firestore user profile
                    const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (profileDoc.exists()) {
                        setRole(profileDoc.data()?.role || 'user');
                    } else {
                        setRole('user');
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setRole('user');
                }
            } else {
                setRole(null);
            }
        });

        return () => unsubscribe();
    }, [db]);

    if (!user) return null;

    const isAdmin = role?.toLowerCase() === 'admin';

    return (
        <div className="flex items-center gap-4 z-50 relative">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium shadow-lg">
                <div className="flex items-center gap-1.5 text-slate-300">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px] lg:max-w-[250px]">{user.email}</span>
                </div>
                <div className="h-3 w-px bg-white/10"></div>
                <div className={`flex items-center gap-1.5 ${isAdmin ? 'text-brand-400 font-bold' : 'text-slate-500'}`}>
                    {isAdmin && <Shield className="w-3.5 h-3.5" />}
                    <span className="uppercase tracking-wider">
                        {isAdmin ? 'ADMIN' : 'USER'}
                    </span>
                </div>
                <div className="h-3 w-px bg-white/10"></div>
                <div className="text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" />
                    APP: EXAM APP
                </div>
            </div>
        </div>
    );
}
