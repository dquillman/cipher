interface AnswerOptionsProps {
    options: string[];
    selectedOption: number | null;
    correctAnswer?: number;
    showExplanation: boolean;
    onSelect: (index: number) => void;
}

// MCQ option list with selection + post-submit correct/incorrect styling.
export default function AnswerOptions({ options, selectedOption, correctAnswer, showExplanation, onSelect }: AnswerOptionsProps) {
    return (
        <div className="space-y-3">
            {options.map((opt, i) => {
                let borderClass = 'border-slate-700 hover:border-brand-500/50 hover:bg-slate-700/50';
                let textClass = 'text-slate-300';
                let dotClass = 'border-slate-500 group-hover:border-brand-400';
                let resultIcon = '';

                if (selectedOption === i) {
                    borderClass = 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10';
                    textClass = 'text-brand-300 font-medium';
                    dotClass = 'border-brand-500 bg-brand-500';
                }

                if (showExplanation) {
                    if (i === correctAnswer) {
                        borderClass = 'border-emerald-500 bg-emerald-500/10';
                        textClass = 'text-emerald-300 font-medium';
                        dotClass = 'border-emerald-500 bg-emerald-500';
                        resultIcon = '✓';
                    } else if (selectedOption === i) {
                        // Gentle incorrect styling — no flash, just a subdued border
                        borderClass = 'border-red-500/60 bg-red-500/5';
                        textClass = 'text-red-300/80 font-medium';
                        dotClass = 'border-red-500/60 bg-red-500/40';
                        resultIcon = '✗';
                    }
                }

                return (
                    <button
                        key={i}
                        onClick={() => onSelect(i)}
                        disabled={showExplanation}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-500 ease-in-out flex items-center gap-4 group motion-reduce:transition-none ${borderClass} ${showExplanation && i === correctAnswer ? 'correct-pop' : ''}`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-500 ease-in-out ${dotClass}`}>
                            {showExplanation && resultIcon ? (
                                <span className="text-xs font-bold text-white">{resultIcon}</span>
                            ) : (
                                selectedOption === i && <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                        </div>
                        <span className={`text-base transition-colors duration-500 ease-in-out ${textClass}`}>
                            {opt}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
