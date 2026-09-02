import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';

// "Why you may see repeated questions" disclosure shown on every quiz
// completion screen. Owns its own open/closed state.
//
// It took no props and named the PMP in both paragraphs, so a Security+,
// Network+ or A+ candidate read about PMP standards on the completion screen of
// their own first session — on three of the four exams we sell.
export default function MasteryDisclosure() {
    const { examName } = useExam();
    const exam = examName || 'this exam';
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-6 text-left">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mx-auto"
            >
                <span>Why you may see repeated questions</span>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {open && (
                <div className="mt-3 bg-slate-700/30 border border-slate-600 rounded-xl p-5 text-sm text-slate-400 space-y-4">
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">How mastery works</h4>
                        <p>CipherExam confirms understanding by requiring correct answers more than once. This prevents progress through guessing and mirrors how {exam} tests consistency across scenarios.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                        <p>All questions are original and written against the published {exam} objectives. They are modelled on real exam patterns and domains, not copied from live exam questions, and they are not reviewed by a certified subject matter expert.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
