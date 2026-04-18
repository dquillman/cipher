import { Clock } from 'lucide-react';

interface QuestionNavigatorProps {
    questions: { id: string }[];
    currentIndex: number;
    answers: Record<number, number>;
    flagged: Record<number, boolean>;
    timeLeft: number;
    examName?: string;
    onNavigate: (index: number) => void;
    onSubmit: () => void;
    onQuit: () => void;
}

export function QuestionNavigator({
    questions,
    currentIndex,
    answers,
    flagged,
    timeLeft,
    examName,
    onNavigate,
    onSubmit,
    onQuit
}: QuestionNavigatorProps) {

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <aside className="w-full md:w-72 bg-slate-800 border-r border-slate-700 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-slate-700">
                {examName && <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 text-center">{examName}</div>}
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time Remaining</h2>
                <div className="flex items-center justify-between text-white font-mono text-xl font-bold bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <span className={timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}>
                        {formatTime(timeLeft)}
                    </span>
                    <Clock className="w-5 h-5 text-slate-500" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Question Map</h3>
                <div className="grid grid-cols-5 gap-2 content-start">
                    {questions.map((_, idx) => {
                        const isAnswered = answers[idx] !== undefined;
                        const isFlagged = flagged[idx];
                        const isCurrent = idx === currentIndex;

                        let bgClass = "bg-slate-700 hover:bg-slate-600 text-slate-300";
                        if (isCurrent) bgClass = "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 z-10";
                        else if (isFlagged) bgClass = "bg-amber-500/20 text-amber-400 border border-amber-500/50";
                        else if (isAnswered) bgClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";

                        return (
                            <button
                                key={idx}
                                onClick={() => onNavigate(idx)}
                                className={`aspect-square rounded-md text-xs font-bold flex items-center justify-center relative transition-all ${bgClass}`}
                            >
                                {idx + 1}
                                {isFlagged && (
                                    <div className="absolute -top-1 -right-1">
                                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-800"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-slate-700 space-y-3 bg-slate-800">
                <div className="flex justify-between text-xs text-slate-400 px-1">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500/50"></div> Answered</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500/50"></div> Flagged</span>
                </div>
                <button
                    onClick={onSubmit}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-colors border border-slate-600"
                >
                    Finish Exam
                </button>
                <button
                    onClick={() => {
                        if (window.confirm("Exit exam? Progress will NOT be saved.")) {
                            onQuit();
                        }
                    }}
                    className="w-full text-slate-500 hover:text-red-400 text-xs text-center p-2 hover:underline transition-colors"
                >
                    Exit Exam (Progress Lost)
                </button>
            </div>
        </aside>
    );
}
