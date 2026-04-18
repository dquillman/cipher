// import { useNavigate } from 'react-router-dom';
import { useSimulator } from '../hooks/useSimulator';
import { QuestionNavigator } from '../components/simulator/QuestionNavigator';
import { QuestionCard } from '../components/simulator/QuestionCard';
import { useExam } from '../contexts/ExamContext';

export default function Simulator() {
    // const navigate = useNavigate();
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
        submitExam
    } = useSimulator();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-display font-medium text-lg">Preparing Exam Environment...</p>
                </div>
            </div>
        );
    }

    if (!questions.length) return null;

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row h-screen overflow-hidden">
            {/* Left Sidebar - Navigator */}
            <div className="hidden md:block">
                <QuestionNavigator onQuit={() => {}}
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

            {/* Mobile-only Navigator Logic could be added here as a drawer if needed */}
        </div>
    );
}

