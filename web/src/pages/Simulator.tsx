import { useNavigate } from 'react-router-dom';
import { useSimulator } from '../hooks/useSimulator';
import { QuestionNavigator } from '../components/simulator/QuestionNavigator';
import { QuestionCard } from '../components/simulator/QuestionCard';
import { useExam } from '../contexts/ExamContext';
import { useStudyTheme } from '../hooks/useStudyTheme';

export default function Simulator() {
    const navigate = useNavigate();
    // Daylight study mode — light skin for bright rooms / long sessions
    const { theme: studyTheme, toggleTheme: toggleStudyTheme } = useStudyTheme();
    const { examName } = useExam();
    const {
        loading,
        questions,
        currentIndex,
        setCurrentIndex,
        answers,
        flagged,
        timeLeft,
        handleAnswer,
        handleFlag,
        quitExam,
        submitExam
    } = useSimulator();

    if (loading) {
        return (
            <div className="min-h-dvh bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-display font-medium text-lg">Preparing Exam Environment...</p>
                </div>
            </div>
        );
    }

    if (!questions.length) {
        // Previously `return null`, which painted a black screen with no text and
        // no way out. A mock can legitimately come back empty (every candidate
        // question quarantined, or a bank still being built) and the tester needs
        // to be told rather than left staring at the background colour.
        return (
            <div className="min-h-dvh bg-slate-900 flex items-center justify-center p-6 text-center text-slate-100">
                <div className="max-w-md">
                    <h1 className="text-xl font-bold mb-2">This mock exam could not be built</h1>
                    <p className="text-slate-400 mb-6">
                        We could not assemble enough questions for {examName || 'this exam'} right now.
                        Nothing is wrong with your account — please try another exam, or practice mode.
                    </p>
                    <button
                        onClick={() => navigate('/app')}
                        className="rounded-md bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    /* Quitting now abandons the run (see useSimulator.quitExam) rather than
     * just navigating away and leaving a timed exam running behind you. */
    const handleQuit = () => { void quitExam(); };

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-dvh bg-slate-900 text-slate-100 flex flex-col md:flex-row h-dvh overflow-hidden
                        pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            {/* Left Sidebar - Navigator */}
            <div className="hidden md:block">
                <QuestionNavigator onQuit={handleQuit}
                    questions={questions}
                    currentIndex={currentIndex}
                    answers={answers}
                    flagged={flagged}
                    timeLeft={timeLeft}
                    examName={examName}
                    onNavigate={setCurrentIndex}
                    onSubmit={() => submitExam()}
                />
            </div>

            {/* Main Content - Question Card */}
            <QuestionCard
                question={currentQ}
                currentNumber={currentIndex + 1}
                totalQuestions={questions.length}
                studyTheme={studyTheme}
                onToggleStudyTheme={toggleStudyTheme}
                selectedOption={answers[currentIndex]}
                isFlagged={flagged[currentIndex]}
                onSelect={handleAnswer}
                onFlag={handleFlag}
                onNext={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                onPrev={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                isFirst={currentIndex === 0}
                isLast={currentIndex === questions.length - 1}
                onSubmit={() => submitExam()}
            />

            {/* The navigator owns the countdown, the exit control and Finish, and
                was `hidden md:block` — so a phone tester sat a timed exam with no
                clock and no way out. Show a compact bar on small screens. */}
            {/* Four things were wrong with the first version of this bar, all
                found by a critic reading it rather than by me writing it:
                it sat on top of the question card's own scroller and footer with
                nothing reserving the space, it double-confirmed because
                submitExam() defaults autoSubmit to false and asks again, it had
                no safe-area inset so on a handset with a home indicator the
                buttons sat under it, and the clock had no low-time state while
                the desktop navigator it replaces turns red under five minutes. */}
            <div className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3
                            border-t border-slate-700 bg-slate-900/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]
                            backdrop-blur">
                <button
                    onClick={() => { if (window.confirm('Exit the exam? Your progress will be lost.')) handleQuit(); }}
                    className="rounded-md border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300"
                >
                    Exit
                </button>
                <span
                    className={`font-mono text-base font-bold tabular-nums ${timeLeft <= 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}
                    aria-live="polite"
                >
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
                <button
                    onClick={() => submitExam()}
                    className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                    Finish
                </button>
            </div>
        </div>
    );
}

