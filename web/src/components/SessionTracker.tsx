import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useSessionTracker } from '../hooks/useSessionTracker';

/**
 * Firestore session tracking, mounted as a lazy child instead of called as a
 * hook in AuthProvider.
 *
 * useSessionTracker statically imports Firestore and the UsageEventService, so
 * calling it from App.tsx put both in the entry chunk of every page — for
 * visitors who are not signed in and never will be. It does nothing at all
 * without a user, so it is only mounted once there is one.
 *
 * closeSession has to reach AuthProvider.logout, which lives above this
 * component, so it is handed up through a ref rather than returned.
 */
export default function SessionTracker({
    user,
    closeRef,
}: {
    user: User;
    closeRef: { current: () => Promise<void> };
}) {
    const { closeSession } = useSessionTracker(user);

    useEffect(() => {
        closeRef.current = closeSession;
        return () => {
            closeRef.current = async () => {};
        };
    });

    return null;
}
