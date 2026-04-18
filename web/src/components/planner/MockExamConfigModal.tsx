import { useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';

interface MockExamConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: { count: number; durationMinutes: number, mode: 'custom' | 'full-mock' }) => void;
}

export default function MockExamConfigModal({ isOpen, onClose, onStart }: MockExamConfigModalProps) {
    const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(120); // Default to 2 hours
    const [customMinutes, setCustomMinutes] = useState<number>(60);

    if (!isOpen) return null;

    const presets = [
        { label: 'Drill Mode', minutes: 60, questions: 50, description: 'Quick check-in.' },
        { label: 'Half-Mock', minutes: 120, questions: 90, description: 'Balanced endurance test.' },
        { label: 'Full Simulation', minutes: 230, questions: 180, description: 'The real deal. 4 Hours.' },
    ];

    const getQuestions = (mins: number) => Math.floor(mins / 1.2);

    const handleStart = () => {
        let minutes = 0;
        let count = 0;
        let mode: 'custom' | 'full-mock' = 'custom';

        if (selectedDuration === 'custom') {
            minutes = customMinutes;
            count = getQuestions(customMinutes);
        } else {
            const preset = presets.find(p => p.minutes === selectedDuration);
            if (preset) {
                minutes = preset.minutes;
                count = preset.questions;
                if (preset.label === 'Full Simulation') mode = 'full-mock';
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
                                key={preset.minutes}
                                onClick={() => setSelectedDuration(preset.minutes)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedDuration === preset.minutes
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-750'
                                    }`}
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg">{preset.label}</div>
                                    <div className={`text-sm ${selectedDuration === preset.minutes ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {preset.description}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xl">{preset.questions} Qs</div>
                                    <div className={`text-sm ${selectedDuration === preset.minutes ? 'text-indigo-200' : 'text-slate-500'}`}>
                                        {preset.minutes < 60 ? `${preset.minutes}m` : `${Math.floor(preset.minutes / 60)}h ${preset.minutes % 60 > 0 ? preset.minutes % 60 + 'm' : ''}`}
                                    </div>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => setSelectedDuration('custom')}
                            className={`w-full p-4 rounded-xl border transition-all ${selectedDuration === 'custom'
                                    ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-white">Custom Duration</span>
                                {selectedDuration === 'custom' && (
                                    <span className="text-indigo-400 font-bold">{getQuestions(customMinutes)} Questions</span>
                                )}
                            </div>

                            {selectedDuration === 'custom' && (
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
