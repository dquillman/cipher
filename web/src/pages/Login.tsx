import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Eye, EyeOff } from 'lucide-react';
import { trackSignupComplete, trackTrialStart } from '../lib/ga4';

/**
 * Maps the `?exam=` query-param slug (used by /lp/* ad landing pages) to
 * the Firestore exam document ID. Pre-seeds `localStorage.selectedExamId`
 * so the ExamProvider picks up the correct cert on first mount — keeps
 * message-match intact from ad → LP → signup → in-app diagnostic.
 *
 * Source of IDs: web/src/config/exams.ts (EXAMS map keys).
 * If a slug isn't in this map, we leave localStorage alone and the
 * ExamProvider falls back to DEFAULT_EXAM_ID — same behaviour as today.
 */
const LP_EXAM_SLUG_TO_ID: Record<string, string> = {
    'pmp':            '7qmPagj9A6RpkC0CwGkY',
    'security-plus':  '79cuGMNydTwDMhyiDjry',
    'shrm-cp':        'bpfawZDj3qalhoU4mdd3',
};

export default function Login() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const examSlug = searchParams.get('exam');

    // Pre-select cert when arriving from a /lp/* ad landing page.
    // Writes the matching Firestore exam ID into localStorage so the
    // ExamProvider picks it up on the user's first dashboard mount.
    useEffect(() => {
        if (!examSlug) return;
        const examId = LP_EXAM_SLUG_TO_ID[examSlug];
        if (!examId) return;
        localStorage.setItem('selectedExamId', examId);
    }, [examSlug]);

    // Default to signup if mode=signup in URL, otherwise login.
    // Arrival with ?exam= is also signup-intent (LP traffic is acquisition).
    const [isLogin, setIsLogin] = useState(mode !== 'signup' && !examSlug);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Check if this is a new user and auto-start trial
            const { doc, getDoc, setDoc, Timestamp, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const userRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // New user - automatically start 14-day trial (Persistent)
                const now = new Date();
                const endDate = new Date();
                endDate.setDate(now.getDate() + 14);

                await setDoc(userRef, {
                    plan: 'pro',
                    trial: true,
                    trialStartedAt: serverTimestamp(),
                    trialEndsAt: Timestamp.fromDate(endDate),
                    access: 'trial',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });

                trackSignupComplete('google', result.user.uid);
                trackTrialStart();
            }

            window.location.href = '/app';
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = '/app';
            } else {
                // Sign up - create new account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Automatically start 14-day trial for new signups
                const { doc, setDoc, Timestamp, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../firebase');

                const now = new Date();
                const endDate = new Date();
                endDate.setDate(now.getDate() + 14);

                const userRef = doc(db, 'users', userCredential.user.uid);

                await setDoc(userRef, {
                    plan: 'pro',
                    trial: true,
                    trialStartedAt: serverTimestamp(),
                    trialEndsAt: Timestamp.fromDate(endDate),
                    access: 'trial',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });

                trackSignupComplete('email', userCredential.user.uid);
                trackTrialStart();
                window.location.href = '/app';
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            let message = "An error occurred during sign in.";
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = "Invalid email or password. Please check your credentials.";
            } else if (err.code === 'auth/email-already-in-use') {
                message = "This email is already registered. Please sign in instead.";
            } else if (err.code === 'auth/weak-password') {
                message = "Password should be at least 6 characters.";
            } else if (err.code === 'auth/operation-not-allowed') {
                message = "Email/Password login is not enabled in Firebase Console.";
            } else if (err.message && err.message.includes('400')) {
                message = "Invalid request. Please check your input.";
            } else {
                message = err.message || message;
            }
            setError(message);
        }
    };

    const handleForgotPassword = async () => {
        setResetMessage('');
        if (!email.trim()) {
            setResetMessage('Please enter your email address above, then click "Forgot password?" again.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage('Password reset email sent. Check your inbox.');
        } catch {
            setResetMessage('Could not send reset email. Please check your email address.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#020617" }}>
            {/* Atmospheric background */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-600/15 blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
            <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl relative z-10">

                {/* Back to Home Link - Added for user safety */}
                <div className="text-left -mt-2 mb-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors mb-4 group"
                        type="button"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">← </span> Back to Home
                    </button>
                </div>

                <div className="text-center">
                    <img src="/favicon.png" alt="CipherExam" className="mx-auto w-12 h-12 rounded-xl object-contain mb-4" />
                    <h2 className="text-3xl font-bold tracking-tight text-white font-display">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {isLogin ? 'Sign in to continue your mastery journey' : 'Start your path to certification today'}
                    </p>
                </div>

                {error && <div className="rounded-lg bg-red-900/20 p-4 text-sm text-red-200 border border-red-900/50">{error}</div>}

                <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex justify-center items-center gap-3 rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-sm font-medium text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                    Sign in with Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-slate-800 px-2 text-slate-500">Or continue with email</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
                            <input
                                type="email"
                                required
                                className="block w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {isLogin && (
                                <div className="mt-2 space-y-1">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                    {resetMessage && (
                                        <p className="text-xs text-slate-400">{resetMessage}</p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        For security reasons, passwords can't be viewed or retrieved. Use "Forgot password" to reset your password.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 shadow-lg shadow-brand-500/20 transition-all"
                        >
                            {isLogin ? 'Sign in' : 'Sign up'}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button
                        className="text-sm font-medium text-brand-400 hover:text-brand-300"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}

