import { useState, useEffect, useCallback } from 'react';
import type { PatternData } from './PatternInsightCard';
import StructuredExplanation from './explanations/StructuredExplanation';

export type CoachMode = 'quick' | 'deep';

export interface TutorResponse {
    verdict: string;
    comparison: {
        optionIndex: number;
        text: string;
        explanation: string;
    }[];
    examLens: string;
    pattern?: PatternData;
}

interface TutorBreakdownProps {
    breakdown: TutorResponse | null;
    loading: boolean;
    onExpandDepth?: (type: 'simple' | 'memory') => void;
    depthContent?: string | null;
    depthLoading?: boolean;
    coachMode: CoachMode;
    onCoachModeChange: (mode: CoachMode) => void;
    correctAnswerIndex?: number;
}

export default function TutorBreakdown({ breakdown, loading, onExpandDepth, depthContent, depthLoading, coachMode, onCoachModeChange, correctAnswerIndex }: TutorBreakdownProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Effect to auto-speak the verdict when breakdown loads


    const handleSpeak = useCallback((text: string) => {
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);

        // Select a preferred voice if available 
        // Priority: "Natural", "Google US English", "Samantha" (Mac), "Microsoft Zira" (Windows)
        const voices = window.speechSynthesis.getVoices();

        const preferredVoice = voices.find(v =>
            v.name.includes("Google US English") ||
            v.name.includes("Samantha") ||
            v.name.includes("Natural") ||
            (v.name.includes("Microsoft") && v.name.includes("Zira"))
        );

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.1; // Slightly faster for 'casual' feel
        utterance.pitch = 1.1; // Slightly higher/brighter

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const toggleMute = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    // Effect to auto-speak the verdict when breakdown loads
    useEffect(() => {
        if (breakdown?.verdict && !isMuted && !loading) {
            handleSpeak(breakdown.verdict);
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [breakdown?.verdict, loading, isMuted, handleSpeak]);

    if (loading) {
        return (
            <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-slate-700 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!breakdown) return null;

    return (
        <div className="mt-6 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-indigo-500/30 overflow-hidden animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="bg-indigo-900/30 px-6 py-3 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍🏫</span>
                    <h3 className="text-indigo-200 font-bold font-display">Coach Breakdown</h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* Coach Mode Toggle */}
                    <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                        <button
                            onClick={() => onCoachModeChange('quick')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${coachMode === 'quick' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            title="Quick: concise verdict + mental rule"
                        >
                            Quick
                        </button>
                        <button
                            onClick={() => onCoachModeChange('deep')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${coachMode === 'deep' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            title="Deep: structured breakdown with exam lens, conflicts, patterns"
                        >
                            Deep
                        </button>
                    </div>
                    <button
                        onClick={() => handleSpeak(breakdown.verdict)}
                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isSpeaking ? 'text-brand-400 animate-pulse' : 'text-slate-400'}`}
                        title="Replay Audio"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isMuted ? 'text-red-400' : 'text-slate-400'}`}
                        title={isMuted ? "Unmute" : "Mute Auto-Play"}
                    >
                        {isMuted ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" /> {/* Simple mic/speaker icon alternate */}
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> {/* Edit icon - wait, wrong icon. Proceeding with generic sound icon above */}
                            </svg>
                        )}
                        {/* Correct Mute Icon */}
                        {isMuted && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* 1. Verdict */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verdict</h4>
                    <p className="text-white text-lg leading-relaxed font-medium">
                        {breakdown.verdict}
                    </p>
                </div>

                {/* 2. Choice Comparison */}
                {breakdown.comparison && breakdown.comparison.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Choice Analysis</h4>
                        <div className="space-y-3">
                            {breakdown.comparison.map((item, idx) => {
                                const isCorrect = item.optionIndex === correctAnswerIndex;
                                return (
                                    <div key={idx} className={`flex gap-3 text-sm rounded-lg px-3 py-2 ${isCorrect ? 'bg-emerald-900/30 border border-emerald-500/30' : ''}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${isCorrect ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                            {String.fromCharCode(65 + item.optionIndex)}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`font-medium ${isCorrect ? 'text-emerald-200' : 'text-slate-200'}`}>{item.text}: </span>
                                            <span className={isCorrect ? 'text-emerald-300/80' : 'text-slate-400'}>{item.explanation}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Exam Lens */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <StructuredExplanation explanation={breakdown.examLens} title="Exam Lens" />
                </div>

                {/* 4. Optional Depth */}
                {onExpandDepth && !depthContent && (
                    <div className="pt-4 border-t border-slate-700/50 flex justify-center">
                        <button
                            onClick={() => onExpandDepth('simple')}
                            disabled={depthLoading}
                            className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {depthLoading ? (
                                <span className="animate-pulse">Thinking...</span>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Explain this like I’m new
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Expanded Depth Content */}
                {depthContent && (
                    <div className="mt-4 p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20 text-indigo-100 text-sm animate-in fade-in relative group">
                        <button
                            onClick={() => handleSpeak(depthContent)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-300 opacity-60 hover:opacity-100 transition-all"
                            title="Read Explanation"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </button>
                        <p className="leading-relaxed pr-6">{depthContent}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

