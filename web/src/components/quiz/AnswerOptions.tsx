interface AnswerOptionsProps {
    options: string[];
    selectedOption: number | null;
    correctAnswer?: number;
    showExplanation: boolean;
    onSelect: (index: number) => void;
    /** Multi-select mode — ECO "Multiple-Response". Renders checkboxes instead
     *  of radios and grades all-or-nothing (see utils/scoring.ts). */
    multi?: boolean;
    /** Multi mode: currently ticked indices. */
    selectedOptions?: number[];
    /** Multi mode: the full answer key. */
    correctAnswers?: number[];
}

// Answer list for single-select (MCQ) and multi-select (ECO Multiple-Response)
// items, with post-submit correct/incorrect styling.
export default function AnswerOptions({
    options,
    selectedOption,
    correctAnswer,
    showExplanation,
    onSelect,
    multi = false,
    selectedOptions = [],
    correctAnswers = [],
}: AnswerOptionsProps) {
    const isSelected = (i: number) => (multi ? selectedOptions.includes(i) : selectedOption === i);
    const isKey = (i: number) => (multi ? correctAnswers.includes(i) : i === correctAnswer);

    return (
        // `role="group"` is applied ONLY in multi mode. Single-select renders the
        // exact same DOM it always has — see the role/aria-checked note on the
        // option button below.
        <div className="space-y-3" role={multi ? 'group' : undefined} aria-label={multi ? 'Select all that apply' : undefined}>
            {multi && !showExplanation && (
                // Deliberately does NOT say how many to pick — the real exam
                // doesn't reveal the answer count, and neither should practice.
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    Select all that apply
                </p>
            )}
            {options.map((opt, i) => {
                let borderClass = 'border-slate-700 hover:border-brand-500/50 hover:bg-slate-700/50';
                let textClass = 'text-slate-300';
                let dotClass = 'border-slate-500 group-hover:border-brand-400';
                let resultIcon = '';

                if (isSelected(i)) {
                    borderClass = 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10';
                    textClass = 'text-brand-300 font-medium';
                    dotClass = 'border-brand-500 bg-brand-500';
                }

                if (showExplanation) {
                    if (isKey(i)) {
                        // Every correct option is marked, whether or not it was
                        // picked — on an all-or-nothing item the candidate needs
                        // to see the answers they MISSED, not just the ones they
                        // got wrong.
                        borderClass = 'border-emerald-500 bg-emerald-500/10';
                        textClass = 'text-emerald-300 font-medium';
                        dotClass = 'border-emerald-500 bg-emerald-500';
                        resultIcon = '✓';
                    } else if (isSelected(i)) {
                        // Gentle incorrect styling — no flash, just a subdued border
                        borderClass = 'border-red-500/60 bg-red-500/5';
                        textClass = 'text-red-300/80 font-medium';
                        dotClass = 'border-red-500/60 bg-red-500/40';
                        resultIcon = '✗';
                    }
                }

                const shapeClass = multi ? 'rounded-md' : 'rounded-full';

                return (
                    <button
                        key={i}
                        type="button"
                        // ARIA is added in multi mode ONLY, and deliberately.
                        //
                        // Single-select must emit no role and no aria-checked,
                        // exactly as before multi mode existed. `role="radio"`
                        // without a `role="radiogroup"` parent is an orphaned
                        // radio: screen readers announce it as an ungrouped
                        // radio with no set position, which is worse than the
                        // plain button they announced before, and it would have
                        // changed the experience for 100% of shipped content.
                        // `role="checkbox"` has no such requirement — a checkbox
                        // is valid standalone — and the wrapper above groups it.
                        role={multi ? 'checkbox' : undefined}
                        aria-checked={multi ? isSelected(i) : undefined}
                        onClick={() => onSelect(i)}
                        disabled={showExplanation}
                        className={`w-full text-left p-3 gap-3 sm:p-4 sm:gap-4 min-h-[44px] rounded-xl border-2 transition-colors duration-500 ease-in-out flex items-center group motion-reduce:transition-none ${borderClass} ${showExplanation && isKey(i) ? 'correct-pop' : ''}`}
                    >
                        <div className={`w-6 h-6 ${shapeClass} border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-500 ease-in-out ${dotClass}`}>
                            {showExplanation && resultIcon ? (
                                <span className="text-xs font-bold text-white">{resultIcon}</span>
                            ) : (
                                isSelected(i) && (
                                    multi
                                        ? <span className="text-xs font-bold text-white leading-none">✓</span>
                                        : <div className="w-2 h-2 bg-white rounded-full" />
                                )
                            )}
                        </div>
                        <span className={`text-[15px] sm:text-base leading-snug sm:leading-normal transition-colors duration-500 ease-in-out ${textClass}`}>
                            {opt}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
