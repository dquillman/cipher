import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.ts';

const ALLOWED_UID = 'XjIHTjghuaWZ79Bqqd0F1Hd34xO2';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) console.log('[Auth] UID:', u.uid, '| Email:', u.email);
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const authorized = user !== null && user.uid === ALLOWED_UID;

  return { user, loading, authorized, login, logout };
}
