import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../firebase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import { doc, getDoc } from 'firebase/firestore';

export default function DiagnosticsPage() {
    const { user } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch user role for admin gate
    useEffect(() => {
        if (!user) { setRoleLoaded(true); return; }
        getDoc(doc(db, 'users', user.uid))
            .then(snap => setRole(snap.exists() ? (snap.data()?.role || 'user') : 'user'))
            .catch(() => setRole('user'))
            .finally(() => setRoleLoaded(true));
    }, [user]);

    if (!roleLoaded) return null;
    if (role?.toLowerCase() !== 'admin') return <Navigate to="/app" replace />;

    const runTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const testFn = httpsCallable(functions, 'testOpenAIConnection');
            const response = await testFn({});
            setResult(response.data);
        } catch (err: any) {
            console.error("Diagnostics failed:", err);
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 font-display text-white">System Diagnostics</h1>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-200">OpenAI Connection</h2>
                    <p className="text-slate-400 mb-6">
                        Test the connectivity between the Firebase Backend and OpenAI API.
                        This verifies that the `OPENAI_API_KEY` secret is correctly set and the quota is active.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={runTest}
                            disabled={loading}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${loading
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                }`}
                        >
                            {loading ? 'Running Test...' : 'Test Connection'}
                        </button>
                    </div>

                    {/* Results */}
                    <div className="mt-8">
                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
                                <strong className="block mb-1 text-red-100">Test Failed ❌</strong>
                                <span className="font-mono text-sm">{error}</span>
                            </div>
                        )}

                        {result && (
                            <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-200">
                                <strong className="block mb-1 text-emerald-100">Test Passed ✅</strong>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 font-mono text-sm">
                                    <div>
                                        <span className="text-emerald-400/70 block text-xs uppercase">Latency</span>
                                        {result.latency}ms
                                    </div>
                                    <div>
                                        <span className="text-emerald-400/70 block text-xs uppercase">Model</span>
                                        {result.model}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-emerald-400/70 block text-xs uppercase">Message</span>
                                        {result.message}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <a href="/app" className="text-slate-500 hover:text-slate-300 transition-colors">← Back to Dashboard</a>
                </div>
            </div>
        </div>
    );
}
