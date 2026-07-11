import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import SeoHead from '../components/SeoHead';
import { SEO } from '../config/seo';
import { Mic, Brain, Crosshair, BarChart3, Flame, Timer } from 'lucide-react';

export default function About() {
    return (
        <div className="decoder min-h-screen flex flex-col bg-slate-900 text-slate-200">
            <SeoHead {...SEO.about} />
            <PublicNav />

            <main className="flex-1 mx-auto max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-white font-display">Master Your Exam with AI</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            CipherExam is your personalized tutor, designed to help you pass your exams efficiently and effectively.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
                                <Mic className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Verbal Mode</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Study hands-free with our AI Voice Tutor. Simulates a real oral exam or interview, challenging you to explain concepts out loud for deeper retention.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 mb-4 border border-pink-500/20">
                                <Brain className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Smart Readiness</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Your diagnostic sets a baseline. Smart Practice drives improvement. Our algorithm weighs your accuracy, trends, and volume to show true readiness.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 mb-4 border border-brand-500/20">
                                <Crosshair className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Adaptive Learning</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                The app learns from your answers. It identifies your weak spots and serves questions specifically targeting those areas to maximize your study time.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center text-accent-400 mb-4 border border-accent-500/20">
                                <BarChart3 className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Visual Progress</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Track your mastery across all domains with our intuitive mastery rings. Watch them close as you gain confidence and competence.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                                <Flame className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Consistency is Key</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Build a daily habit. Even 10 questions a day can make a massive difference. Keep your streak alive to stay motivated.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                                <Timer className="h-6 w-6" strokeWidth={1.75} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 font-display">Exam Simulator</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Ready for the real thing? Take full 50-question mock exams under timed conditions with no hints. Test your nerves before test day.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-700/50">
                        <h3 className="text-2xl font-bold text-white mb-6 font-display">How to Get the Most Value</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">1</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Practice with Smart Start</h4>
                                    <p className="text-slate-400 text-sm">Jump into Smart Practice from your dashboard. The AI picks questions targeting your weak spots and tracks your improvement.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">2</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Review Explanations</h4>
                                    <p className="text-slate-400 text-sm">Don't just check if you were right or wrong. Read the detailed explanations to understand the <i>why</i> behind the answer.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">3</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Explain Out Loud</h4>
                                    <p className="text-slate-400 text-sm">Use Verbal Mode to practice explaining concepts. Speaking active recall strengthens neural pathways more than just reading.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">4</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Aim for 100% Readiness</h4>
                                    <p className="text-slate-400 text-sm">Your goal is to fill all the mastery rings and achieve a "High" readiness score before your exam date.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/app"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-6 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                        >
                            Start Practicing Now
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-xs text-slate-600 border-t border-slate-800">
                <div className="max-w-4xl mx-auto px-4 mb-4 space-y-2">
                    <p className="font-semibold text-slate-500">Legal Disclaimers</p>
                    <p>
                        <strong>No Guarantee:</strong> Use of this app does not guarantee exam success or licensure.
                    </p>
                    <p>
                        <strong>Not Professional Advice:</strong> This app is for educational purposes only and is not a substitute for professional, legal, medical, or financial advice.
                    </p>
                    <p>
                        <strong>Affiliation:</strong> This app is not affiliated with, endorsed, or sponsored by PMI, CompTIA, CFA Institute, or any other exam owner/regulator. PMP®, CompTIA®, and other trademarks are the property of their respective owners.
                    </p>
                </div>
                <p>&copy; {new Date().getFullYear()} CipherExam. All rights reserved.</p>
            </footer>
        </div>
    );
}
