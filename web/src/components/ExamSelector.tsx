import { useState, useEffect } from 'react';
import { ExamService, type ExamSummary } from '../services/ExamService';
import { useExam } from '../contexts/ExamContext';
import { trackExamSelected } from '../lib/ga4';

export default function ExamSelector() {
    const { selectedExamId, switchExam, examName: currentExamName } = useExam();
    const [exams, setExams] = useState<ExamSummary[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const fetchedExams = await ExamService.fetchPublishedExams();
                setExams(fetchedExams);
            } catch (error) {
                console.error("Error fetching exams:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    const handleSelect = (examId: string) => {
        const exam = exams.find(e => e.id === examId);
        trackExamSelected(examId, exam?.name || 'Unknown');
        switchExam(examId);
        setIsOpen(false);
        // We can reload if we suspect deep state issues, but Context *should* propagate
        // window.location.reload(); 
    };

    if (loading) return <div className="h-10 w-32 bg-slate-800/50 rounded-lg animate-pulse" />;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-sm md:text-base text-white font-medium transition-all"
            >
                <span className="truncate max-w-[120px] sm:max-w-none">{currentExamName || 'Select Exam'}</span>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[14rem] bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                        {exams.map((exam) => (
                            <button
                                key={exam.id}
                                onClick={() => handleSelect(exam.id)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between
                                    ${selectedExamId === exam.id
                                        ? 'bg-brand-500/10 text-brand-300'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {exam.name}
                                {selectedExamId === exam.id && (
                                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
