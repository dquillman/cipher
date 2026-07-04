import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// "Why you may see repeated questions" disclosure shown on every quiz
// completion screen. Owns its own open/closed state.
export default function MasteryDisclosure() {
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
                        <p>CipherExam confirms understanding by requiring correct answers more than once. This prevents progress through guessing and mirrors how the PMP exam tests consistency across scenarios.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">About the questions</h4>
                        <p>All questions are original and written to PMP standards. They are modeled on real exam patterns and domains — not copied from actual PMP exam questions.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
