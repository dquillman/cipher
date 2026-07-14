import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Play, Square, Volume2, Settings, Check, Headphones } from 'lucide-react';
import DashboardLink from '../components/DashboardLink';
import { useVoiceAssistant, pickCipherVoice } from '../hooks/useVoiceAssistant';
import { SmartQuizService } from '../services/smartQuiz';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Question } from '../hooks/useSimulator';
import { useExam } from '../contexts/ExamContext';

type ModeState = 'SETUP' | 'LOADING' | 'READING' | 'LISTENING' | 'FEEDBACK' | 'FINISHED';

// The Cipher coach persona: brisk, slightly lower-pitched, confident American.
// Deliberately NOT Jarvis's signature (en-GB, 0.98/1.02) — same humanity
// (neural voices via pickCipherVoice), different character.
const CIPHER_TONE = { rate: 1.04, pitch: 0.92 };

// Spoken persona lines — dry-witty coach for working professionals. Rotated
// randomly so repeat sessions don't feel canned. Keep entries SHORT: they're
// heard, not read.
const QUIPS = {
    intro: [
        (n: number) => `${n} questions, zero mercy. Let's decode.`,
        (n: number) => `Alright — ${n} questions. I'll read, you decide. Deal.`,
        (n: number) => `Session armed: ${n} questions. Coffee optional, judgment mandatory.`,
    ],
    correct: [
        "Correct. You made that look easier than it was.",
        "That's the one. Somewhere, a proctor just sighed.",
        "Right again. I'm starting to feel decorative.",
        "Correct. The exam would like a word with whoever trained you.",
    ],
    incorrect: [
        (letter: string) => `Not this time — the answer was ${letter}. Even good decoders hit static.`,
        (letter: string) => `Close, but the exam wanted ${letter}. Filing that one under plot twist.`,
        (letter: string) => `That's a miss. Correct answer: ${letter}. Don't worry — I've already deleted the evidence.`,
        (letter: string) => `Incorrect — it was ${letter}. The upside: you will never fall for that trap again.`,
    ],
    retry: [
        "I didn't catch that. My hearing is excellent, so let's blame the microphone. A, B, C, or D — or just click one.",
        "Still nothing. Say the option letter like you mean it — or click it, I won't judge.",
    ],
    outroHigh: (s: number, t: number) => `${s} out of ${t}. Frankly, I'd let you sign my audit. Well done.`,
    outroMid: (s: number, t: number) => `${s} out of ${t}. Solid work — we'll sharpen the rest.`,
    outroLow: (s: number, t: number) => `${s} out of ${t}. The exam won this round. We're taking the rematch.`,
};

const pickQuip = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface SessionStats {
    score: number;
    wrong: number;
    details: {
        questionId: string;
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
        domain: string;
    }[];
}

export default function VerbalMode() {
    const navigate = useNavigate();
    const { examName, selectedExamId } = useExam();
    const [status, setStatus] = useState<ModeState>('SETUP');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(localStorage.getItem('verbal_voice_uri') || '');

    // New Feature State
    const [targetQuestionCount, setTargetQuestionCount] = useState(5);
    const [stats, setStats] = useState<SessionStats>({ score: 0, wrong: 0, details: [] });

    // Feedback visuals for mouse/voice answers: which option was picked and
    // which was correct, shown while the coach explains.
    const [lastAnswer, setLastAnswer] = useState<{ selected: number; correct: number } | null>(null);

    // Refs to handle stale closures in async voice callbacks
    const questionsRef = useRef<Question[]>([]);
    const currentIndexRef = useRef(0);
    const statsRef = useRef<SessionStats>({ score: 0, wrong: 0, details: [] });
    const hasReceivedInput = useRef(false);
    const isMounted = useRef(true);
    const statusRef = useRef<ModeState>('SETUP');
    const answeredRef = useRef(false); // one answer per question, mouse or voice

    // Sync refs with state
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
    useEffect(() => { statsRef.current = stats; }, [stats]);
    useEffect(() => { statusRef.current = status; }, [status]);

    // Voice Hook
    const { speak, listen, stopAll, voices } = useVoiceAssistant({
        onError: (err) => {
            console.error("Voice Error:", err);
            if (status === 'LISTENING') {
                if (err === 'no-speech') {
                    speak("I didn't hear anything. Say A, B, C, or D — or just click your answer.", () => {
                        if (isMounted.current) startListening();
                    }, currentVoice, CIPHER_TONE);
                } else {
                    setStatus('SETUP');
                    speak("Voice error. Stopping session.", undefined, currentVoice, CIPHER_TONE);
                }
            }
        },
        onListeningEnd: () => {
            if (status === 'LISTENING' && !hasReceivedInput.current) {
                setTimeout(() => {
                    if (isMounted.current && status === 'LISTENING' && !hasReceivedInput.current) {
                        speak("I didn't catch that.", () => {
                            if (isMounted.current) startListening();
                        }, currentVoice, CIPHER_TONE);
                    }
                }, 500);
            }
        }
    });

    // Determine actual voice object. With no explicit user choice, default to
    // the best available US neural voice (Edge "Online Natural" > Google US)
    // instead of the browser's robotic default.
    const currentVoice = voices.find(v => v.voiceURI === selectedVoiceURI) || pickCipherVoice(voices);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            stopAll();
        };
    }, [stopAll]);

    // Close voice selector on Escape
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && showSettings) setShowSettings(false);
    }, [showSettings]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [handleEscape]);

    const loadQuestions = async () => {
        setStatus('LOADING');
        const examId = selectedExamId;

        try {
            const ids = await SmartQuizService.generateSimulationExam(examId, targetQuestionCount);
            const loadedQuestions: Question[] = [];
            for (const id of ids) {
                const snap = await getDoc(doc(db, 'questions', id));
                if (snap.exists()) {
                    loadedQuestions.push({ id: snap.id, ...snap.data() } as Question);
                }
            }

            if (isMounted.current) {
                if (loadedQuestions.length === 0) {
                    alert("No questions found.");
                    setStatus('SETUP');
                    return;
                }
                setQuestions(loadedQuestions);
                setStats({ score: 0, wrong: 0, details: [] });
                startSession(loadedQuestions);
            }
        } catch (e) {
            console.error(e);
            setStatus('SETUP');
        }
    };

    function startSession(loadedQs: Question[]) {
        if (loadedQs.length === 0) return;
        setStatus('READING');
        speak(pickQuip(QUIPS.intro)(loadedQs.length), () => {
            if (isMounted.current) playQuestion(0, loadedQs);
        }, currentVoice, CIPHER_TONE);
    }

    function playQuestion(index: number, currentQuestions = questions) {
        // Fallback to ref if we are in a stale closure causing currentQuestions to be empty/default
        const validQuestions = (currentQuestions && currentQuestions.length > 0) ? currentQuestions : questionsRef.current;

        if (index >= validQuestions.length) {
            finishSession();
            return;
        }

        const q = validQuestions[index];
        const textToRead = `Question ${index + 1}. ${q.stem}. Option A: ${q.options[0]}. Option B: ${q.options[1]}. Option C: ${q.options[2]}. Option D: ${q.options[3]}. What is your answer?`;

        answeredRef.current = false;
        setLastAnswer(null);
        setStatus('READING');

        setTimeout(() => {
            speak(textToRead, () => {
                if (!isMounted.current) return;
                // A mouse click may have answered mid-read; don't reopen the mic.
                if (answeredRef.current) return;
                startListening();
            }, currentVoice, CIPHER_TONE);
        }, 1000);
    }

    function startListening() {
        if (!isMounted.current) return;
        setStatus('LISTENING');
        setTranscript('');
        hasReceivedInput.current = false;

        listen((result) => {
            hasReceivedInput.current = true;
            setTranscript(result);
            processAnswer(result);
        });
    }

    // Word-boundary parsing. The old substring test (`lower.includes('a')`)
    // mis-fired on ordinary words — "the Answer is D" selected A. Contractions
    // like "I'd" are stripped so their trailing letter can't match either.
    function parseSpokenAnswer(spokenText: string): number {
        const lower = spokenText.toLowerCase().replace(/\b\w+'(d|ll|s|re|ve|m)\b/g, ' ');
        const letter = lower.match(/\b(?:option\s+|letter\s+|answer\s+)?([abcd])\b/);
        if (letter) return { a: 0, b: 1, c: 2, d: 3 }[letter[1] as 'a' | 'b' | 'c' | 'd'];
        if (/\b(one|first|1)\b/.test(lower)) return 0;
        if (/\b(two|second|2)\b/.test(lower)) return 1;
        if (/\b(three|third|3)\b/.test(lower)) return 2;
        if (/\b(four|fourth|last|4)\b/.test(lower)) return 3;
        return -1;
    }

    // Shared answer path — reached by voice (parsed transcript) or mouse click.
    function submitAnswer(selectedIndex: number) {
        if (answeredRef.current) return; // one answer per question
        // ALWAYS USE REF HERE TO AVOID STALE CLOSURE
        const currentQ = questionsRef.current[currentIndexRef.current];
        if (!currentQ) {
            console.error("No question found at index using refs", currentIndexRef.current);
            return;
        }
        answeredRef.current = true;

        const correctIdx = typeof currentQ.correctAnswer === 'string' ? parseInt(currentQ.correctAnswer as unknown as string, 10) : currentQ.correctAnswer;
        const isCorrect = selectedIndex === correctIdx;

        // Update Stats
        setStats(prev => ({
            score: prev.score + (isCorrect ? 1 : 0),
            wrong: prev.wrong + (isCorrect ? 0 : 1),
            details: [...prev.details, {
                questionId: currentQ.id,
                selectedOption: selectedIndex,
                correctOption: correctIdx,
                isCorrect,
                domain: currentQ.domain
            }]
        }));

        setLastAnswer({ selected: selectedIndex, correct: correctIdx });
        setStatus('FEEDBACK');
        const feedback = isCorrect
            ? pickQuip(QUIPS.correct)
            : pickQuip(QUIPS.incorrect)(['A', 'B', 'C', 'D'][correctIdx]);
        const explanation = `Here is why: ${currentQ.explanation}`;

        speak(`${feedback} ${explanation}. Moving on.`, () => {
            if (!isMounted.current) return;
            const next = currentIndexRef.current + 1;
            setCurrentIndex(next); // Update State
            playQuestion(next); // Pass index
        }, currentVoice, CIPHER_TONE);
    }

    function processAnswer(spokenText: string) {
        const selectedIndex = parseSpokenAnswer(spokenText);
        if (selectedIndex !== -1) {
            submitAnswer(selectedIndex);
        } else {
            speak(pickQuip(QUIPS.retry), () => {
                startListening();
            }, currentVoice, CIPHER_TONE);
        }
    }

    // Mouse path: clicking an option answers immediately — during the read,
    // while listening, whenever. Cancels any in-flight speech/mic first.
    function handleMouseAnswer(i: number) {
        const st = statusRef.current;
        if (st !== 'READING' && st !== 'LISTENING') return;
        if (answeredRef.current) return;
        hasReceivedInput.current = true; // suppress the "didn't catch that" retry
        stopAll();
        setTranscript(['A', 'B', 'C', 'D'][i]);
        submitAnswer(i);
    }

    const finishSession = async () => {
        setStatus('FINISHED');
        // Use refs to get latest values regardless of closure
        const finalStats = statsRef.current;
        const finalCount = questionsRef.current.length;

        const ratio = finalCount > 0 ? finalStats.score / finalCount : 0;
        const outro = ratio >= 0.8 ? QUIPS.outroHigh : ratio >= 0.5 ? QUIPS.outroMid : QUIPS.outroLow;
        speak(`Session complete. ${outro(finalStats.score, finalCount)}`, undefined, currentVoice, CIPHER_TONE);

        // Note: Verbal mode results are saved via QuizRunService (quizRuns collection)
    };

    const selectVoice = (uri: string) => {
        setSelectedVoiceURI(uri);
        localStorage.setItem('verbal_voice_uri', uri);

        // Preview
        const v = voices.find(voice => voice.voiceURI === uri);
        if (v) {
            speak("This is my voice. I can live with it if you can.", undefined, v, CIPHER_TONE);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-8 relative overflow-hidden">
            {/* Back to Dashboard */}
            <div className="w-full z-10">
                <DashboardLink />
            </div>

            {/* Header */}
            <div className="w-full flex justify-between items-center z-10">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Volume2 className="w-5 h-5" />
                        <span className="font-bold tracking-wider">VERBAL</span>
                    </div>
                    {examName && <span className="text-sm text-indigo-300 font-bold tracking-widest uppercase mt-1">{examName}</span>}
                    {(status === 'READING' || status === 'LISTENING' || status === 'FEEDBACK') && (
                        <div className="flex gap-4 text-sm mt-1">
                            <span className="text-emerald-400 font-bold">✓ {stats.score}</span>
                            <span className="text-red-400 font-bold">✗ {stats.wrong}</span>
                        </div>
                    )}
                </div>

                {/* Voice Settings Toggle */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    title="Voice Settings"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            {/* Main Visual */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 max-w-2xl px-4">

                {status === 'SETUP' && (
                    <div className="text-center w-full max-w-md bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm">
                        <h1 className="text-3xl font-black mb-2">Verbal Mode</h1>
                        <p className="text-slate-400 mb-8">Hands-free verbal practice session.</p>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50 text-left">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">How it works</h4>
                            <ul className="text-sm text-slate-400 space-y-2">
                                <li className="flex items-start gap-2">
                                    <Volume2 className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                                    <span>Questions are read aloud using text-to-speech</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mic className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                                    <span>Answer by voice (say "Option A") — or just click an option</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Headphones className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                                    <span>Use headphones in a quiet environment for best results</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mb-8">
                            <label className="block text-slate-500 text-sm font-bold mb-4 uppercase tracking-wider">How many questions?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                {[5, 10, 20, 50].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => setTargetQuestionCount(count)}
                                        className={`p-3 rounded-xl font-bold transition-all ${targetQuestionCount === count ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={loadQuestions} className="w-full py-4 bg-indigo-600 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 fill-white" /> START SESSION
                        </button>
                        <p className="text-xs text-slate-500 mt-4 text-center">Tip: Start with 5 questions to get familiar with the format.</p>
                    </div>
                )}

                {status === 'LOADING' && (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-indigo-400 font-bold">Loading Session...</span>
                    </div>
                )}

                {(status === 'READING' || status === 'LISTENING' || status === 'FEEDBACK') && questions[currentIndex] && (
                    <div className="w-full space-y-6">
                        {/* Status Indicator */}
                        <div className="flex justify-center mb-8">
                            {status === 'READING' && <span className="text-indigo-400 font-bold animate-pulse flex items-center gap-2"><Volume2 className="w-5 h-5" /> READING</span>}
                            {status === 'LISTENING' && <span className="text-emerald-400 font-bold animate-bounce flex items-center gap-2"><Mic className="w-5 h-5" /> LISTENING</span>}
                            {status === 'FEEDBACK' && <span className="text-amber-400 font-bold flex items-center gap-2">CHECKING</span>}
                        </div>

                        {/* Hint for User */}
                        {status === 'LISTENING' && (
                            <div className="absolute top-32 left-0 w-full text-center">
                                <span className="text-slate-500 text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/50">
                                    Say <strong>"Option A–D"</strong> — or click your answer
                                </span>
                            </div>
                        )}

                        {/* Question Text */}
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                            <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-6">
                                <span className="text-slate-500 mr-2">{currentIndex + 1}.</span>
                                {questions[currentIndex].stem}
                            </h2>
                            <div className="grid gap-3">
                                {questions[currentIndex].options.map((opt, i) => {
                                    const answerable = status === 'READING' || status === 'LISTENING';
                                    let frame = 'bg-slate-800/50 border-slate-700/50';
                                    let key = 'text-indigo-400';
                                    if (answerable) {
                                        frame += ' hover:border-indigo-400/70 hover:bg-slate-800 cursor-pointer';
                                    } else if (status === 'FEEDBACK' && lastAnswer) {
                                        if (i === lastAnswer.correct) {
                                            frame = 'bg-emerald-500/10 border-emerald-500/60';
                                            key = 'text-emerald-400';
                                        } else if (i === lastAnswer.selected) {
                                            frame = 'bg-red-500/10 border-red-500/50';
                                            key = 'text-red-400';
                                        }
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleMouseAnswer(i)}
                                            disabled={!answerable}
                                            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors disabled:cursor-default ${frame}`}
                                        >
                                            <span className={`font-bold w-6 ${key}`}>{['A', 'B', 'C', 'D'][i]}</span>
                                            <span className="text-slate-200 text-lg leading-snug">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Transcript Feedback */}
                        {status === 'LISTENING' && (
                            <div className="text-center">
                                <p className="text-slate-500 text-sm">Detected: <span className="text-white font-mono">{transcript || "..."}</span></p>
                            </div>
                        )}
                    </div>
                )}

                {status === 'FINISHED' && (
                    <div className="text-center max-w-md w-full bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">Session Complete!</h1>
                        <p className="text-slate-400 mb-6">Results saved to your readiness profile.</p>

                        <div className="flex justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-3xl font-black text-emerald-400">{stats.score}</div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-red-400">{stats.wrong}</div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Wrong</div>
                            </div>
                        </div>

                        <button onClick={() => navigate('/app')} className="w-full px-8 py-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl font-bold border border-slate-700 transition-all">Back to Dashboard</button>
                    </div>
                )}
            </div>

            {/* Controls */}
            {status !== 'SETUP' && status !== 'FINISHED' && status !== 'LOADING' && (
                <button
                    onClick={() => { stopAll(); setStatus('SETUP'); }}
                    className="w-full max-w-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 p-6 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all"
                >
                    <Square className="w-6 h-6 fill-current" />
                    STOP SESSION
                </button>
            )}

            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Voice Selector Modal */}
            {showSettings && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[999]" onClick={() => setShowSettings(false)} />
                    <div className="fixed inset-0 z-[1000] flex items-start justify-end p-4 pointer-events-none">
                        <div className="relative z-[1001] bg-slate-900 rounded-xl shadow-2xl w-80 max-h-[80vh] overflow-hidden pointer-events-auto mt-20 border border-slate-700">
                            <div className="p-4 border-b border-slate-700 bg-slate-800">
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Select Voice</h3>
                            </div>
                            <div className="max-h-[calc(80vh-60px)] overflow-y-auto bg-slate-900/50">
                                {voices.length > 0 ? voices.map(voice => (
                                    <button
                                        key={voice.voiceURI}
                                        onClick={() => selectVoice(voice.voiceURI)}
                                        className={`w-full text-left p-3 px-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 ${selectedVoiceURI === voice.voiceURI ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300'}`}
                                    >
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="truncate text-sm font-medium">{voice.name}</span>
                                            <span className="text-xs text-slate-500">{voice.lang}</span>
                                        </div>
                                        {selectedVoiceURI === voice.voiceURI && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                                    </button>
                                )) : (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No voices found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
