import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useExam } from '../contexts/ExamContext';
import { isMarketedExam } from '../config/exams';
import DashboardLink from '../components/DashboardLink';
import { ExamListSkeleton } from '../components/ui/Skeleton';

interface Exam {
    id: string;
    name: string;
    description: string;
    questionCount: number;
}

const EXAM_CATEGORIES: Record<string, { label: string; borderColor: string; textColor: string }> = {
    'PMP': { label: 'Project Management', borderColor: 'border-l-indigo-500', textColor: 'text-indigo-400' },
    'PgMP': { label: 'Project Management', borderColor: 'border-l-indigo-500', textColor: 'text-indigo-400' },
    'CSM': { label: 'Agile & Scrum', borderColor: 'border-l-emerald-500', textColor: 'text-emerald-400' },
    'Security+': { label: 'Cybersecurity', borderColor: 'border-l-red-500', textColor: 'text-red-400' },
    'Network+': { label: 'Networking', borderColor: 'border-l-sky-500', textColor: 'text-sky-400' },
    'A+': { label: 'IT Fundamentals', borderColor: 'border-l-sky-500', textColor: 'text-sky-400' },
    'SHRM': { label: 'Human Resources', borderColor: 'border-l-amber-500', textColor: 'text-amber-400' },
    'ITIL': { label: 'IT Service', borderColor: 'border-l-teal-500', textColor: 'text-teal-400' },
    'Six Sigma': { label: 'Quality', borderColor: 'border-l-violet-500', textColor: 'text-violet-400' },
    'CIA': { label: 'Audit & Finance', borderColor: 'border-l-orange-500', textColor: 'text-orange-400' },
    'Payroll': { label: 'Payroll & Finance', borderColor: 'border-l-orange-500', textColor: 'text-orange-400' },
};

function getExamCategory(examName: string) {
    for (const [keyword, category] of Object.entries(EXAM_CATEGORIES)) {
        if (examName.includes(keyword)) return category;
    }
    return null;
}

export default function ExamList() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedExamId, switchExam } = useExam();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'exams'));
                const examsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Exam[];
                // Filter out unpublished exams. The marketed-four filter is applied
                // at render, not here, so it can also let the user's currently
                // selected bank through (see visibleExams below).
                setExams(examsData.filter((e: any) => e.isPublished).sort((a, b) => a.name.localeCompare(b.name)));
            } catch (error) {
                console.error("Error fetching exams:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    // The picker shows the four advertised exams and nothing else — no
    // exceptions, including for a user whose saved selection is an older bank.
    // `isPublished` is a Firestore field that knows nothing about this config,
    // so filtering on it alone offered every published bank (eleven of them,
    // plus retired exam codes) against a site that claims four.
    const visibleExams = exams.filter((exam) => isMarketedExam(exam.id));

    if (loading) {
        return (
            <div className="min-h-dvh bg-slate-900 text-slate-200 font-sans p-8">
                <div className="max-w-7xl mx-auto">
                    <ExamListSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-slate-900 text-slate-200 font-sans p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <DashboardLink />
                <div>
                    <h1 className="text-3xl font-bold text-white font-display tracking-tight">Available Exams</h1>
                    <p className="text-slate-400 mt-1">Select an exam to start practicing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleExams.map((exam) => {
                        const category = getExamCategory(exam.name);
                        const isCurrent = exam.id === selectedExamId;
                        return (
                        <div key={exam.id} className={`bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/10 group border-l-4 ${category?.borderColor ?? 'border-l-slate-600'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* "Current" read as a claim about the exam version — a problem
                                        on a page where three cards say they replaced an older exam
                                        code. It only ever meant "this is the one you have selected". */}
                                    {isCurrent && (
                                        <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">Studying now</span>
                                    )}
                                    <span className="text-xs font-bold text-slate-500 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                                        {exam.questionCount} Qs
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 font-display">{exam.name}</h3>
                            {category && <span className={`text-xs font-medium ${category.textColor}`}>{category.label}</span>}
                            <p className="text-slate-400 text-sm mb-6 mt-2 line-clamp-2">{exam.description}</p>

                            <Link
                                to={`/app/quiz/${exam.id}`}
                                onClick={() => {
                                    // Update ExamContext (not just localStorage) so the whole
                                    // app — header, dashboard, and the quiz's context-derived
                                    // exam name/domains — switches to the clicked exam, not a
                                    // stale one. switchExam writes localStorage AND state.
                                    void switchExam(exam.id);
                                }}
                                className="block w-full text-center bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-900/20"
                            >
                                Select Exam
                            </Link>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
