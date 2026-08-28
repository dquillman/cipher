import { useState } from 'react';
import AnswerOptions from '../components/quiz/AnswerOptions';
import ExplanationPanel from '../components/quiz/ExplanationPanel';
import StudyThemeToggle from '../components/quiz/StudyThemeToggle';
import { useStudyTheme } from '../hooks/useStudyTheme';
import type { Question } from '../types/Question';

// DEV-ONLY preview of the quiz screen for exercising Daylight study mode
// without auth (registered in App.tsx behind import.meta.env.DEV). Mirrors
// Quiz.tsx's real structure and mounts the real presentational components so
// the utility remap in index.css can be verified against real markup.

const MOCK_QUESTION: Question = {
    id: 'daylight-preview',
    stem: 'A project manager discovers a key stakeholder has been excluded from status meetings. What should the PM do first?',
    options: [
        'Add the stakeholder to the next meeting invite',
        'Review the communications management plan',
        'Escalate to the project sponsor',
        'Document the issue in the risk register',
    ],
    correctAnswer: 1,
    explanation:
        'PMI thinking: consult the plan before acting. The communications management plan defines who receives which meeting — fixing the invite treats the symptom, not the process gap.',
    domain: 'Stakeholder Engagement',
    bloomLevel: 'Analyze',
    type: 'mcq',
};

export default function DaylightPreview() {
    const { theme, toggleTheme } = useStudyTheme();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    return (
        <div className="min-h-dvh flex flex-col bg-slate-900 text-slate-100">
            {/* Header — mirrors Quiz.tsx */}
            <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-4 py-4 sticky top-0 z-50">
                <div className="mx-auto max-w-4xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-sm font-medium">Quit &amp; Save</span>
                        <div className="h-6 w-px bg-slate-700"></div>
                        <span className="text-sm font-medium text-slate-400 font-display">{MOCK_QUESTION.domain}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <StudyThemeToggle theme={theme} onToggle={toggleTheme} />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-400">Q7</span>
                            <span className="text-sm text-slate-500">/ 10</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress bar */}
            <div className="h-1 bg-slate-800 w-full">
                <div className="h-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '70%' }}></div>
            </div>

            {/* Main content — mirrors Quiz.tsx card structure */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-3xl">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 border border-slate-700 overflow-hidden max-w-full">
                        <div className="p-4 sm:p-8">
                            <h2 className="text-lg sm:text-xl font-medium text-white leading-relaxed mb-8">{MOCK_QUESTION.stem}</h2>
                            <AnswerOptions
                                options={MOCK_QUESTION.options!}
                                selectedOption={selectedOption}
                                correctAnswer={MOCK_QUESTION.correctAnswer}
                                showExplanation={showExplanation}
                                onSelect={(i) => !showExplanation && setSelectedOption(i)}
                            />
                            {showExplanation && (
                                <ExplanationPanel
                                    question={MOCK_QUESTION}
                                    activeExamId="preview"
                                    tutorBreakdown={null}
                                    loadingBreakdown={false}
                                    depthContent={null}
                                    depthLoading={false}
                                    coachMode="quick"
                                    onCoachModeChange={() => {}}
                                    onExpandDepth={() => {}}
                                    onLoadBreakdown={() => {}}
                                />
                            )}
                        </div>
                        <div className="bg-slate-900/30 px-4 sm:px-8 py-4 border-t border-slate-700/50 flex justify-end">
                            <button
                                onClick={() => setShowExplanation((s) => !s)}
                                disabled={selectedOption === null}
                                className="bg-brand-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-40"
                            >
                                {showExplanation ? 'Reset' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
