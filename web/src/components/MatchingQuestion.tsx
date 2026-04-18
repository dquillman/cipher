import { useState, useCallback } from 'react';
import { Check, X, ArrowRight, ArrowUpDown } from 'lucide-react';

/**
 * EC-119: Matching Question (tap-to-swap)
 *
 * Presents terms on the left and shuffled definitions on the right.
 * Users tap two right-side items to swap them into the correct positions.
 */

export interface MatchPair {
    term: string;
    definition: string;
}

interface MatchingQuestionProps {
    pairs: MatchPair[];
    locked: boolean;
    correctOrder: number[];
    shuffledDefinitions: string[];
    currentOrder: number[];
    onReorder: (newOrder: number[]) => void;
}

export default function MatchingQuestion({
    pairs,
    locked,
    correctOrder,
    shuffledDefinitions,
    currentOrder,
    onReorder,
}: MatchingQuestionProps) {
    const [selected, setSelected] = useState<number | null>(null);

    const handleTap = useCallback((idx: number) => {
        if (locked) return;
        if (selected === null) {
            setSelected(idx);
        } else {
            if (selected !== idx) {
                const newOrder = [...currentOrder];
                const temp = newOrder[selected];
                newOrder[selected] = newOrder[idx];
                newOrder[idx] = temp;
                onReorder(newOrder);
            }
            setSelected(null);
        }
    }, [selected, currentOrder, onReorder, locked]);

    return (
        <div className="space-y-3">
            {/* Instructions */}
            <p className="text-sm text-slate-400 mb-4">
                {locked
                    ? 'Review the correct matches below.'
                    : selected !== null
                        ? 'Now tap another definition to swap them.'
                        : 'Tap a definition to select it, then tap another to swap.'}
            </p>

            {pairs.map((pair, i) => {
                const defIdx = currentOrder[i];
                const definition = shuffledDefinitions[defIdx];
                const isCorrectMatch = locked && defIdx === correctOrder[i];
                const isWrongMatch = locked && defIdx !== correctOrder[i];
                const isSelected = selected === i;
                const isSwapTarget = selected !== null && selected !== i && !locked;

                let rightBorder = 'border-slate-700';
                let rightBg = 'bg-slate-800/40';
                let ringClass = '';

                if (isSelected) {
                    rightBorder = 'border-brand-500';
                    rightBg = 'bg-brand-500/10';
                    ringClass = 'ring-2 ring-brand-500/40';
                }
                if (isSwapTarget) {
                    rightBorder = 'border-slate-600 hover:border-brand-400';
                    rightBg = 'hover:bg-brand-400/5';
                }
                if (isCorrectMatch) {
                    rightBorder = 'border-emerald-500/60';
                    rightBg = 'bg-emerald-500/5';
                }
                if (isWrongMatch) {
                    rightBorder = 'border-red-500/40';
                    rightBg = 'bg-red-500/5';
                }

                return (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
                        {/* Left: Term (fixed) */}
                        <div className="flex-1 p-3 sm:p-4 rounded-xl border-2 border-slate-600 bg-slate-800/60 flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {i + 1}
                            </span>
                            <span className="text-sm sm:text-base text-slate-200 font-medium">
                                {pair.term}
                            </span>
                        </div>

                        {/* Arrow */}
                        <div className="hidden sm:flex items-center justify-center flex-shrink-0">
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>

                        {/* Right: Definition (tappable) */}
                        <div
                            onClick={() => handleTap(i)}
                            className={`flex-1 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 select-none ${
                                locked ? '' : 'cursor-pointer'
                            } ${rightBorder} ${rightBg} ${ringClass}`}
                        >
                            {!locked && (
                                <ArrowUpDown className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                    isSelected ? 'text-brand-400' : 'text-slate-500'
                                }`} />
                            )}
                            {locked && isCorrectMatch && (
                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {locked && isWrongMatch && (
                                <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm sm:text-base ${
                                isCorrectMatch ? 'text-emerald-300' :
                                isWrongMatch ? 'text-red-300/80' :
                                isSelected ? 'text-brand-300' :
                                'text-slate-300'
                            }`}>
                                {definition}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Correct answers shown after submit for wrong matches */}
            {locked && currentOrder.some((d, i) => d !== correctOrder[i]) && (
                <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                    <p className="text-sm font-medium text-slate-300 mb-2">Correct matches:</p>
                    <div className="space-y-1.5">
                        {pairs.map((pair, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="text-indigo-400 font-medium">{pair.term}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                <span className="text-emerald-400">{pair.definition}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Utility: shuffle definitions and compute the correct order mapping.
 */
export function shuffleMatchPairs(pairs: MatchPair[]): {
    shuffledDefinitions: string[];
    correctOrder: number[];
    initialOrder: number[];
} {
    const indices = pairs.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledDefinitions = indices.map(i => pairs[i].definition);

    const correctOrder = pairs.map((_, i) => {
        return indices.indexOf(i);
    });

    const initialOrder = shuffledDefinitions.map((_, i) => i);

    return { shuffledDefinitions, correctOrder, initialOrder };
}
