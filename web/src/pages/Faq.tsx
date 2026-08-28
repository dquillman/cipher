import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLink from '../components/DashboardLink';
import { DISPLAY_VERSION } from '../version';

interface FaqItem {
    question: string;
    answer: React.ReactNode;
    category: 'Questions & Practice' | 'Thinking Traps' | 'Study Plan' | 'General';
}

const faqItems: FaqItem[] = [
    {
        category: 'Questions & Practice',
        question: "Why do I sometimes see the same question more than once?",
        answer: (
            <div className="space-y-4">
                <p>
                    CipherExam may repeat a question to confirm mastery, not guessing.
                    Answering a question correctly once doesn't always prove understanding — consistency does.
                </p>
                <p>
                    The PMP exam evaluates your ability to apply concepts reliably across scenarios, and CipherExam is designed to mirror that behavior.
                </p>
                <div>
                    <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                    <p>
                        All questions are original and written to PMP standards. They are modeled on real exam patterns and domains — not copied from actual PMP exam questions.
                    </p>
                </div>
                <p>
                    Seeing a repeated question is a signal that the system is validating understanding, not a limitation in the question pool.
                </p>
            </div>
        ),
    },
    {
        category: 'Questions & Practice',
        question: "Are these real PMP exam questions?",
        answer: (
            <div className="space-y-4">
                <p>No. CipherExam does not use real PMP exam questions.</p>
                <p>
                    All questions are original, written to PMP standards, and designed to reflect the structure, difficulty, and reasoning patterns of the real exam. This allows you to practice thinking the way the PMP exam requires without relying on memorization or copyrighted material.
                </p>
                <p>
                    The goal is mastery of concepts and decision-making — not recall of specific questions.
                </p>
            </div>
        ),
    },
    {
        category: 'Questions & Practice',
        question: "What is Smart Practice?",
        answer: (
            <div className="space-y-4">
                <p>Smart Practice adapts to you.</p>
                <p>Instead of showing questions randomly, it prioritizes:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Concepts you've struggled with</li>
                    <li>Areas where consistency hasn't been proven yet</li>
                    <li>Patterns that indicate partial understanding</li>
                </ul>
                <p>
                    This means Smart Practice may feel harder at times — by design. It focuses your effort where it matters most, rather than where you're already comfortable.
                </p>
            </div>
        ),
    },
    {
        category: 'Questions & Practice',
        question: "Why do some quizzes feel harder than expected?",
        answer: (
            <div className="space-y-4">
                <p>Because difficulty isn't fixed — it's contextual.</p>
                <p>CipherExam adjusts question selection based on:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Your recent answers</li>
                    <li>How consistently you apply concepts</li>
                    <li>The domain you're practicing</li>
                </ul>
                <p>
                    If a quiz feels harder, it usually means the system is testing depth of understanding, not surface knowledge. That's intentional — and closer to how the real PMP exam behaves.
                </p>
            </div>
        ),
    },
    {
        category: 'Thinking Traps',
        question: "What is a thinking trap?",
        answer: (
            <div className="space-y-4">
                <p>A thinking trap is a common but incorrect way of reasoning that feels right in the moment.</p>
                <p>The PMP exam frequently tests these traps — for example:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Choosing the most active response instead of the most appropriate one</li>
                    <li>Solving the symptom instead of addressing the process</li>
                    <li>Acting too early when analysis is required</li>
                </ul>
                <p>
                    CipherExam highlights thinking traps to help you recognize and correct these patterns before exam day.
                </p>
            </div>
        ),
    },
    {
        category: 'General',
        question: "Is CipherExam designed to work on a phone?",
        answer: (
            <div className="space-y-4">
                <p>Not at this time.</p>
                <p>
                    CipherExam is currently designed for desktop and larger screens, where complex questions, explanations, and review workflows can be presented clearly and without compromise.
                </p>
                <p>
                    While some parts of the app may load on a phone, the experience is not optimized for small screens and may feel cramped or incomplete. For best results, we strongly recommend using a desktop or laptop.
                </p>
                <p>
                    Mobile support is something we may explore in the future, but for now our focus is on providing the best possible learning experience on larger screens.
                </p>
            </div>
        ),
    },
    {
        category: 'Thinking Traps',
        question: "Why don't I see any Trap (Mind Trap) quizzes yet?",
        answer: (
            <div className="space-y-4">
                <p>Trap quizzes become available after you've completed enough practice for the system to identify your specific thinking patterns.</p>
                <p>
                    These quizzes target the mental shortcuts and assumptions that commonly trip up test-takers. Until you've built up sufficient practice history, the system focuses on foundational learning through Domain and Smart quizzes.
                </p>
                <p>Keep practicing — once patterns emerge, Trap quizzes will unlock automatically.</p>
            </div>
        ),
    },
    {
        category: 'General',
        question: "Why don't diagnostic questions count toward my daily goal?",
        answer: (
            <div className="space-y-4">
                <p>The diagnostic quiz is a one-time baseline assessment, not regular practice.</p>
                <p>
                    Its purpose is to help the system understand your starting point — not to measure daily effort. Your daily goal tracks active learning: Domain quizzes, Smart quizzes, and other intentional practice sessions.
                </p>
            </div>
        ),
    },
    {
        category: 'Study Plan',
        question: "How does the Study Plan decide what I should do next?",
        answer: (
            <div className="space-y-4">
                <p>The Study Plan builds a schedule based on your exam date, weekly study time, and diagnostic results.</p>
                <p>It prioritizes:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Domains where you showed the most room for improvement</li>
                    <li>A balanced mix of reading, Domain quizzes, and periodic Smart quizzes for reinforcement</li>
                    <li>Mock exams on weekends to build stamina</li>
                </ul>
                <p>The plan adapts as you progress, so recommendations may shift over time.</p>
            </div>
        ),
    },
    {
        category: 'Thinking Traps',
        question: "What are Trap (Mind Trap) quizzes?",
        answer: (
            <div className="space-y-4">
                <p>Trap quizzes focus on the specific thinking patterns that cause you to miss questions — not just content gaps.</p>
                <p>
                    These quizzes are designed to surface and correct the mental shortcuts that feel right but lead to wrong answers. They become available once the system has enough data about your response patterns.
                </p>
            </div>
        ),
    },
    {
        category: 'Study Plan',
        question: "Why do some tasks appear later instead of today?",
        answer: (
            <div className="space-y-4">
                <p>
                    The Study Plan spreads tasks across your available days to avoid overwhelming you and to build long-term retention.
                </p>
                <p>
                    Cramming doesn't work for the PMP exam. Spacing out practice — especially for weaker domains — leads to better recall on exam day. Trust the pacing; consistency beats intensity.
                </p>
            </div>
        ),
    },
    {
        category: 'Study Plan',
        question: "Can I refresh my Study Plan?",
        answer: (
            <div className="space-y-4">
                <p>Yes. You can regenerate your Study Plan at any time from the Study Plan settings.</p>
                <p>
                    If your exam date changes or your availability shifts, updating the plan will recalculate recommendations based on your current progress and new constraints.
                </p>
            </div>
        ),
    },
];

export default function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-dvh bg-slate-900 text-slate-100 pb-24">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <DashboardLink />

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
                    <p className="text-slate-400">How CipherExam works — clearly and intentionally.</p>
                </div>

                {/* FAQ Accordion — grouped by category */}
                {(['Questions & Practice', 'Thinking Traps', 'Study Plan', 'General'] as const).map(cat => {
                    const items = faqItems.filter(item => item.category === cat);
                    if (items.length === 0) return null;
                    return (
                        <div key={cat} className="mb-8">
                            <h2 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-brand-500 rounded-full" />
                                {cat}
                            </h2>
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const globalIndex = faqItems.indexOf(item);
                                    const isOpen = openIndex === globalIndex;

                                    return (
                                        <div
                                            key={globalIndex}
                                            className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggle(globalIndex)}
                                                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-750 transition-colors"
                                            >
                                                <span className="font-medium text-white pr-4">{item.question}</span>
                                                {isOpen
                                                    ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                                                    : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                                                }
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-5 border-t border-slate-700/50">
                                                    <div className="text-sm text-slate-400 leading-relaxed pt-4">
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Footer */}
                <p className="text-sm text-slate-500 mt-10 text-center italic">
                    If something feels unexpected, it's usually intentional — and designed to prepare you for the real exam.
                </p>
                <p className="text-sm font-bold text-slate-400 mt-4 text-center">v{DISPLAY_VERSION}</p>

            </div>
        </div>
    );
}
