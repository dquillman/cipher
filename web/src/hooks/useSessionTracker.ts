import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { UsageEventService } from '../services/UsageEventService';

/**
 * Hook to track user sessions in Firestore.
 * Creates a session doc on login, sends heartbeats, and closes it on logout.
 */
export function useSessionTracker(user: User | null) {
    const sessionIdRef = useRef<string | null>(sessionStorage.getItem('ecp_session_id'));
    const loginAtRef = useRef<number | null>(null);
    const location = useLocation();

    const createSession = async () => {
        if (!user || sessionIdRef.current) return;

        try {
            const loginTime = Date.now();
            const docRef = await addDoc(collection(db, 'user_sessions'), {
                userId: user.uid,
                email: user.email,
                app: 'examcoachpro',
                loginAt: serverTimestamp(),
                lastSeenAt: serverTimestamp(),
                logoutAt: null,
                durationSec: null,
                endedBy: null,
                userAgent: navigator.userAgent
            });

            sessionIdRef.current = docRef.id;
            loginAtRef.current = loginTime; // Local approximation for duration calc
            sessionStorage.setItem('ecp_session_id', docRef.id);

            // Usage event: once per calendar day
            const today = new Date().toISOString().split('T')[0];
            const key = `ec_usage_session_${user.uid}_${today}`;
            if (!localStorage.getItem(key)) {
                UsageEventService.emit(user.uid, 'session');
                localStorage.setItem(key, '1');
            }

            console.log('Session created:', docRef.id);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const updateHeartbeat = async () => {
        if (!sessionIdRef.current) return;
        try {
            await updateDoc(doc(db, 'user_sessions', sessionIdRef.current), {
                lastSeenAt: serverTimestamp()
            });
        } catch (error) {
            // If doc is missing (e.g. deleted by admin), clear local ref
            if ((error as any).code === 'not-found') {
                sessionIdRef.current = null;
                sessionStorage.removeItem('ecp_session_id');
            }
            console.error('Heartbeat failed:', error);
        }
    };

    // Re-sync login time if session exists in storage but memory is fresh
    useEffect(() => {
        const syncLoginTime = async () => {
            if (sessionIdRef.current && !loginAtRef.current) {
                try {
                    const snap = await getDoc(doc(db, 'user_sessions', sessionIdRef.current));
                    if (snap.exists()) {
                        loginAtRef.current = snap.data().loginAt?.toDate().getTime() || null;
                    }
                } catch (e) {
                    console.error('Failed to sync login time:', e);
                }
            }
        };
        if (user) syncLoginTime();
    }, [user]);

    // Create session on login
    useEffect(() => {
        if (user && !sessionIdRef.current) {
            createSession();
        } else if (!user) {
            sessionIdRef.current = null;
            loginAtRef.current = null;
            sessionStorage.removeItem('ecp_session_id');
        }
    }, [user]);

    // Heartbeat interval (60 seconds)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(updateHeartbeat, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Visibility changes (Update on tab focus)
    useEffect(() => {
        if (!user) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') updateHeartbeat();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user]);

    // Route changes (Update on navigation)
    useEffect(() => {
        if (user) updateHeartbeat();
    }, [location.pathname, user]);

    /**
     * Closes the current session. Should be called BEFORE auth.signOut().
     */
    const closeSession = async () => {
        if (!sessionIdRef.current) return;

        try {
            const sId = sessionIdRef.current;
            const docRef = doc(db, 'user_sessions', sId);

            let durationSec = null;
            if (loginAtRef.current) {
                durationSec = Math.round((Date.now() - loginAtRef.current) / 1000);
            }

            await updateDoc(docRef, {
                logoutAt: serverTimestamp(),
                endedBy: 'logout',
                durationSec: durationSec
            });

            console.log('Session closed successfully:', sId);
            sessionIdRef.current = null;
            loginAtRef.current = null;
            sessionStorage.removeItem('ecp_session_id');
        } catch (error) {
            console.error('Failed to close session:', error);
        }
    };

    return { closeSession };
}
