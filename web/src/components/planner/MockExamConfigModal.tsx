import { useMemo, useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { EXAMS } from '../../config/exams';
import { useExam } from '../../contexts/ExamContext';

interface MockExamConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: { count: number; durationMinutes: number, mode: 'custom' | 'full-mock' }) => void;
}

/** Used only when the selected exam has no fullMock entry in config/exams.ts.
 *  Deliberately generic — never exam-specific. */
const FALLBACK_MOCK = { questionCount: 100, durationMinutes: 120 };

const FULL_SIMULATION = 'Full Simulation';

/** "4 hours", "3 hours 50 min", "45 minutes" */
function formatDurationLong(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} minutes`;
    const hourPart = `${h} ${h === 1 ? 'hour' : 'hours'}`;
    return m === 0 ? hourPart : `${hourPart} ${m} min`;
}

/** "4h", "3h 50m", "45m" */
function formatDurationShort(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function MockExamConfigModal({ isOpen, onClose, onStart }: MockExamConfigModalProps) {
    const { selectedExamId } = useExam();
    const [selectedPreset, setSelectedPreset] = useState<string>('Half-Mock');
    const [customMinutes, setCustomMinutes] = useState<number>(60);

    // Every preset is derived from the selected exam's real full-mock shape, so
    // a Security+ or SHRM-CP user is never offered a PMP-shaped simulation.
    const fullMock = EXAMS[selectedExamId]?.fullMock ?? FALLBACK_MOCK;

    const presets = useMemo(() => {
        const { questionCount, durationMinutes } = fullMock;
        const scale = (fraction: number) => ({
            minutes: Math.max(10, Math.round((durationMinutes * fraction) / 5) * 5),
            questions: Math.max(5, Math.round(questionCount * fraction)),
        });
        const drill = scale(0.25);
        const half = scale(0.5);
        return [
            { label: 'Drill Mode', ...drill, description: 'Quick check-in.', isFullMock: false },
            { label: 'Half-Mock', ...half, description: 'Balanced endurance test.', isFullMock: false },
            {
                label: FULL_SIMULATION,
                minutes: durationMinutes,
                questions: questionCount,
                description: `The real deal. ${formatDurationLong(durationMinutes)}.`,
                isFullMock: true,
            },
        ];
    }, [fullMock.questionCount, fullMock.durationMinutes]);

    // Question pacing for the custom slider follows the real exam's pace
    // (questions per minute) rather than a hard-coded PMP ratio.
    const questionsPerMinute = fullMock.questionCount / fullMock.durationMinutes;
    const getQuestions = (mins: number) => Math.max(1, Math.floor(mins * questionsPerMinute));

    if (!isOpen) return null;

    const handleStart = () => {
        let minutes = 0;
        let count = 0;
        let mode: 'custom' | 'full-mock' = 'custom';

        if (selectedPreset === 'custom') {
            minutes = customMinutes;
            count = getQuestions(customMinutes);
        } else {
            const preset = presets.find(p => p.label === selectedPreset);
            if (preset) {
                minutes = preset.minutes;
                count = preset.questions;
                if (preset.isFullMock) mode = 'full-mock';
            }
        }

        onStart({ count, durationMinutes: minutes, mode });

    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Setup Mock Exam</h2>
                            <p className="text-slate-400">Choose your time commitment.</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        {presets.map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => setSelectedPreset(preset.label)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedPreset === preset.label
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-750'
                                    }`}
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg">{preset.label}</div>
                                    <div className={`text-sm ${selectedPreset === preset.label ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {preset.description}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xl">{preset.questions} Qs</div>
                                    <div className={`text-sm ${selectedPreset === preset.label ? 'text-indigo-200' : 'text-slate-500'}`}>
                                        {formatDurationShort(preset.minutes)}
                                    </div>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => setSelectedPreset('custom')}
                            className={`w-full p-4 rounded-xl border transition-all ${selectedPreset === 'custom'
                                    ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-white">Custom Duration</span>
                                {selectedPreset === 'custom' && (
                                    <span className="text-indigo-400 font-bold">{getQuestions(customMinutes)} Questions</span>
                                )}
                            </div>

                            {selectedPreset === 'custom' && (
                                <div className="mt-3">
                                    <input
                                        type="range"
                                        min="10"
                                        max="300"
                                        step="10"
                                        value={customMinutes}
                                        onChange={(e) => setCustomMinutes(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>10 min</span>
                                        <span className="text-white font-bold text-base">{customMinutes} Minutes</span>
                                        <span>5 hours</span>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-amber-200 text-sm">
                            Questions are randomly selected from the entire database to simulate a fresh exam experience every time.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStart}
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Start Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
