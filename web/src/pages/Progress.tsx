import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface ProgressStats {
    total: number;
    mastered: number;
    learning: number;
    new: number;
}

export default function Progress() {
    const [stats, setStats] = useState<ProgressStats>({ total: 0, mastered: 0, learning: 0, new: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                // 1. Get Total Questions
                const questionsSnap = await getDocs(collection(db, 'questions'));
                const total = questionsSnap.size;

                // 2. Get User Progress
                const progressSnap = await getDocs(collection(db, 'users', user.uid, 'questionProgress'));
                let mastered = 0;
                let learning = 0;

                progressSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'mastered') mastered++;
                    else if (data.status === 'learning') learning++;
                });

                setStats({
                    total,
                    mastered,
                    learning,
                    new: total - mastered - learning
                });

            } catch (error) {
                console.error("Error fetching progress:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    const masteryPercentage = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display tracking-tight">Your Mastery</h1>
                        <p className="text-slate-400 mt-1">Track your journey to 100% exam readiness.</p>
                    </div>
                </div>

                {/* Main Stats Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="text-center md:text-left">
                            <div className="text-6xl font-bold text-white font-display mb-2">{masteryPercentage}%</div>
                            <div className="text-brand-400 font-bold uppercase tracking-wider text-sm">Mastery Level</div>
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-emerald-400 font-bold">Mastered ({stats.mastered})</span>
                                    <span className="text-slate-500">{Math.round((stats.mastered / stats.total) * 100)}%</span>
                                </div>
                                <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.mastered / stats.total) * 100}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-amber-400 font-bold">Learning ({stats.learning})</span>
                                    <span className="text-slate-500">{Math.round((stats.learning / stats.total) * 100)}%</span>
                                </div>
                                <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.learning / stats.total) * 100}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400 font-bold">New ({stats.new})</span>
                                    <span className="text-slate-500">{Math.round((stats.new / stats.total) * 100)}%</span>
                                </div>
                                <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(stats.new / stats.total) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-2">Mastered</h3>
                        <p className="text-slate-400 text-sm">Questions you've answered correctly 2+ times in a row.</p>
                        <div className="mt-4 text-3xl font-bold text-emerald-400">{stats.mastered}</div>
                    </div>
                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-2">Learning</h3>
                        <p className="text-slate-400 text-sm">Questions you're currently working on or got wrong recently.</p>
                        <div className="mt-4 text-3xl font-bold text-amber-400">{stats.learning}</div>
                    </div>
                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-2">To Do</h3>
                        <p className="text-slate-400 text-sm">Questions you haven't seen yet.</p>
                        <div className="mt-4 text-3xl font-bold text-slate-400">{stats.new}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
