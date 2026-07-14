import { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import TutorBreakdown, { type TutorResponse, type CoachMode } from '../TutorBreakdown';
import StructuredExplanation from '../explanations/StructuredExplanation';
import EmvCalculation from '../explanations/EmvCalculation';
import { DOMAIN_CITATIONS, EXAM_REFERENCES } from '../../utils/domainCitations';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS, type BloomLevel } from '../../types/Bloom';
import type { Question } from '../../types/Question';

interface ExplanationPanelProps {
    question: Question;
    activeExamId: string;
    tutorBreakdown: TutorResponse | null;
    loadingBreakdown: boolean;
    depthContent: string | null;
    depthLoading: boolean;
    coachMode: CoachMode;
    onCoachModeChange: (mode: CoachMode) => void;
    onExpandDepth: (type: 'simple' | 'memory') => void;
    onLoadBreakdown: () => void;
}

// Expanded post-answer explanation: EMV walkthrough, Bloom badge, coach
// breakdown (or standard explanation fallback), and the reference footer.
export default function ExplanationPanel({
    question,
    activeExamId,
    tutorBreakdown,
    loadingBreakdown,
    depthContent,
    depthLoading,
    coachMode,
    onCoachModeChange,
    onExpandDepth,
    onLoadBreakdown,
}: ExplanationPanelProps) {
    // Anti-flash / anti-yank rules for the standard-explanation fallback:
    // 1. GRACE: while the coach is generating, wait ~800ms before revealing the
    //    standard explanation — cache hits arrive inside the window, so fast
    //    responses render the coach directly with no one-second flash.
    // 2. PIN: once the standard explanation IS on screen, never auto-replace
    //    it. The arriving breakdown becomes a "Show Coach Breakdown" button and
    //    swaps only when the reader asks.
    const [standardVisible, setStandardVisible] = useState(!loadingBreakdown && !tutorBreakdown);
    const [pinnedStandard, setPinnedStandard] = useState(false);

    useEffect(() => {
        if (tutorBreakdown) return;
        if (!loadingBreakdown) { setStandardVisible(true); return; }
        const t = setTimeout(() => setStandardVisible(true), 800);
        return () => clearTimeout(t);
    }, [loadingBreakdown, tutorBreakdown]);

    // PIN decision happens DURING RENDER (React's derive-state-from-previous-
    // render pattern), not in a useEffect: an effect fires after paint, which
    // let one frame of the coach panel flash in and yank the standard text
    // before the pin re-rendered it back (verified live: coach appeared at
    // t≈9.4s for ~600ms, then flipped back). Render-phase adjustment re-runs
    // before anything is committed, so the swap frame never paints.
    const [prevBreakdown, setPrevBreakdown] = useState(tutorBreakdown);
    if (tutorBreakdown !== prevBreakdown) {
        setPrevBreakdown(tutorBreakdown);
        if (tutorBreakdown && standardVisible && !pinnedStandard) {
            setPinnedStandard(true);
        }
    }

    const showCoach = tutorBreakdown && !pinnedStandard;

    return (
        <div className="answer-reveal mt-8 pt-6 border-t border-slate-700">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-3 sm:p-6 lg:p-10">
                {question.type === "emv" && question.scenarios && (
                    <EmvCalculation scenarios={question.scenarios} />
                )}

                <div className="bg-blue-900/20 rounded-lg border border-blue-500/30 text-blue-200 p-4 mb-4">
                    <p className="text-xl md:text-2xl font-bold text-white mb-1">Let’s walk through the thinking behind this question.</p>
                    {question.bloomLevel && BLOOM_LEVELS.includes(question.bloomLevel) && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm md:text-base text-blue-300/70">Bloom's Taxonomy level:</span>
                            <span
                                title={`Bloom's Taxonomy: ${BLOOM_DESCRIPTIONS[question.bloomLevel as BloomLevel]}`}
                                className="text-sm md:text-base font-bold px-3 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                            >
                                <Brain className="w-5 h-5" />
                                {question.bloomLevel}
                            </span>
                            <span className="text-sm md:text-base text-blue-200/60 hidden md:inline">
                                — {BLOOM_DESCRIPTIONS[question.bloomLevel as BloomLevel]}
                            </span>
                        </div>
                    )}
                </div>

                {showCoach ? (
                    <TutorBreakdown
                        breakdown={tutorBreakdown}
                        loading={false}
                        onExpandDepth={onExpandDepth}
                        depthContent={depthContent}
                        depthLoading={depthLoading}
                        coachMode={coachMode}
                        onCoachModeChange={onCoachModeChange}
                        correctAnswerIndex={question.correctAnswer}
                    />
                ) : (
                    <div className="text-center p-4">
                        {tutorBreakdown && pinnedStandard ? (
                            /* Breakdown arrived while the standard text was being
                               read — swap only when the reader asks. */
                            <button
                                onClick={() => { setPinnedStandard(false); setStandardVisible(false); }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors shadow-lg shadow-brand-500/20"
                            >
                                <Sparkles className="w-4 h-4" />
                                Coach Breakdown is ready — view it
                            </button>
                        ) : loadingBreakdown ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-brand-300">
                                <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
                                {standardVisible
                                    ? "Coach breakdown incoming — here's the standard explanation meanwhile:"
                                    : "Coach is thinking…"}
                            </div>
                        ) : (
                            <button
                                onClick={onLoadBreakdown}
                                className="text-brand-400 hover:text-brand-300 underline"
                            >
                                Load Coach Breakdown
                            </button>
                        )}
                        {standardVisible && (
                            <div className="mt-4 p-4 text-left leading-relaxed text-base md:text-lg text-slate-200">
                                <StructuredExplanation explanation={question.explanation} title="Standard Explanation" />
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 border-t border-slate-700/50 pt-4">
                    <div className="text-sm md:text-base font-semibold text-slate-200 tracking-wide">
                        📘 Reference
                    </div>
                    <div className="mt-1 text-sm md:text-base text-slate-400 italic">
                        {DOMAIN_CITATIONS[question.domain] ?? EXAM_REFERENCES[activeExamId] ?? "Exam Reference Guide"}
                    </div>
                </div>
            </div>
        </div>
    );
}
