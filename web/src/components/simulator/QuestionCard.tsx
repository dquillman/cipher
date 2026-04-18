import { Flag, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Question } from '../../hooks/useSimulator';

interface QuestionCardProps {
    question: Question;
    currentNumber: number;
    totalQuestions: number;
    selectedOption?: number;
    isFlagged?: boolean;
    onSelect: (idx: number) => void;
    onFlag: () => void;
    onNext: () => void;
    onPrev: () => void;
    isFirst: boolean;
    isLast: boolean;
    onSubmit: () => void;
}

export function QuestionCard({
    question,
    currentNumber,
    totalQuestions,
    selectedOption,
    isFlagged,
    onSelect,
    onFlag,
    onNext,
    onPrev,
    isFirst,
    isLast,
    onSubmit
}: QuestionCardProps) {
    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
            {/* Header / Meta */}
            <header className="px-6 py-4 md:px-12 md:py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center z-10">
                <div>
                    <h2 className="text-white font-bold text-lg md:text-xl font-display">{question.domain || "General Knowledge"}</h2>
                    <p className="text-slate-400 text-sm font-mono mt-0.5">Question {currentNumber} of {totalQuestions}</p>
                </div>
                <button
                    onClick={onFlag}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isFlagged
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                        }`}
                >
                    <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium hidden md:inline">{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
                </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:px-12 md:py-8 max-w-5xl mx-auto w-full">
                <div className="prose prose-invert max-w-none mb-8">
                    <p className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
                        {question.stem}
                    </p>
                </div>

                {question.imageUrl && (
                    <div className="mb-10 rounded-2xl overflow-hidden border border-slate-700 bg-black/50 p-4">
                        <img
                            src={question.imageUrl}
                            alt="Question Reference"
                            className="max-h-80 mx-auto object-contain"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    {question.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const label = String.fromCharCode(65 + idx); // A, B, C, D...

                        return (
                            <div
                                key={idx}
                                onClick={() => onSelect(idx)}
                                className={`group flex items-start gap-4 p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${isSelected
                                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,1)] z-10'
                                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${isSelected
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-300'
                                    }`}>
                                    {label}
                                </div>
                                <span className={`text-lg pt-0.5 ${isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-slate-200'}`}>
                                    {option}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer / Navigation */}
            <footer className="px-6 py-4 md:px-12 md:py-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur z-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <button
                        onClick={onPrev}
                        disabled={isFirst}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Previous</span>
                    </button>

                    {isLast ? (
                        <button
                            onClick={onSubmit}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all translate-y-0 hover:-translate-y-0.5"
                        >
                            <span>Finish Exam</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all translate-y-0 hover:-translate-y-0.5"
                        >
                            <span>Next Question</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
