import { useLocation } from 'react-router-dom';
import { Brain, Crosshair, Zap, ShieldCheck } from 'lucide-react';

// Mode info header shown above the question card. Which banner renders is
// driven by location.state (smart / weakest / domain filter / trap modes)
// and the resolved quizType, exactly as it was inline in Quiz.tsx.
export default function QuizModeBanner({ quizType }: { quizType: string }) {
    const location = useLocation();

    return (
        <div className="w-full max-w-3xl mb-6">
            {location.state?.mode === 'smart' ? (
                <div className="bg-brand-900/30 border border-brand-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-brand-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                        <h3 className="text-brand-300 font-bold mb-1">Daily Practice Mode</h3>
                        <p className="text-sm text-slate-300">
                            Our AI selects questions to optimize your learning: introducing new topics while reviewing past material to ensure implementation.
                        </p>
                    </div>
                </div>
            ) : location.state?.mode === 'weakest' ? (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                        <h3 className="text-purple-300 font-bold mb-1">Smart Practice: {location.state.filterDomain}</h3>
                        <p className="text-sm text-slate-300">
                            We identified <strong>{location.state.filterDomain}</strong> as your weakest area. This session is focused on turning that weakness into a strength.
                        </p>
                    </div>
                </div>
            ) : location.state?.filterDomain ? (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                        <h3 className="text-purple-300 font-bold mb-1">{location.state.filterDomain} Practice Mode</h3>
                        <p className="text-sm text-slate-300">
                            This session targets the <strong>{location.state.filterDomain}</strong> domain to help you turn weaknesses into strengths.
                        </p>
                    </div>
                </div>
            ) : location.state?.mode === 'trap-drill' ? (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <Crosshair className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                        <h3 className="text-indigo-300 font-bold mb-1">Trap Drill: {location.state.patternName}</h3>
                        <p className="text-sm text-slate-300">
                            5-question micro-drill targeting this thinking trap.
                        </p>
                    </div>
                </div>
            ) : location.state?.mode === 'trap' ? (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                        <h3 className="text-indigo-300 font-bold mb-1">Trap Repair: {location.state.patternName}</h3>
                        <p className="text-sm text-slate-300">
                            Focused practice to master this specific exam pattern.
                        </p>
                    </div>
                </div>
            ) : quizType === 'diagnostic' ? (
                <div className="bg-gradient-to-r from-brand-900/30 to-brand-800/30 border border-brand-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-2xl">🔎</span>
                    <div>
                        <h3 className="text-brand-300 font-bold mb-1">I’m analyzing your logic, not just your score.</h3>
                        <p className="text-sm text-slate-300">
                            Don't worry about getting these wrong. I'm just finding your baseline.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-2xl">📝</span>
                    <div>
                        <h3 className="text-slate-300 font-bold mb-1">General Practice Mode</h3>
                        <p className="text-sm text-slate-400">
                            Standard practice mode using questions from the current exam config.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
