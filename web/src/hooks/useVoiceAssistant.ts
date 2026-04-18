import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceAssistantConfig {
    onListeningStart?: () => void;
    onListeningEnd?: () => void;
    onError?: (error: string) => void;
}

export const useVoiceAssistant = (config: VoiceAssistantConfig = {}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const configRef = useRef(config);

    // Update config ref if it changes
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setSupported(false);
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            configRef.current.onListeningStart?.();
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            configRef.current.onListeningEnd?.();
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            configRef.current.onError?.(event.error);
        };

    }, []);

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            // Filter for English voices to reduce clutter
            const englishVoices = available.filter(v => v.lang.startsWith('en'));
            setVoices(englishVoices.length > 0 ? englishVoices : available);
        };

        loadVoices();

        // Chrome requires this event
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void, voice?: SpeechSynthesisVoice | null) => {
        if (!synthesisRef.current) return;

        // Cancel any ongoing speech
        synthesisRef.current.cancel();

        // Chunking logic to avoid browser TTS timeout on long text
        // Split by punctuation followed by space, keeping the punctuation
        const chunks = text.match(/[^.!?]+[.!?]+["']?|.+$/g) || [text];

        // Refined chunks: ensure no chunk is too long (> 160 chars is a safe limit for Chrome)
        const safeChunks: string[] = [];
        chunks.forEach(chunk => {
            if (chunk.length < 160) {
                safeChunks.push(chunk.trim());
            } else {
                // Split overly long chunks by commas or spaces
                const subChunks = chunk.match(/.{1,160}(?:\s|$)/g) || [chunk];
                subChunks.forEach(sc => safeChunks.push(sc.trim()));
            }
        });

        let currentChunk = 0;

        const speakNext = () => {
            if (currentChunk >= safeChunks.length) {
                setIsSpeaking(false);
                onEnd?.();
                return;
            }

            const chunkText = safeChunks[currentChunk];
            if (!chunkText) {
                currentChunk++;
                speakNext();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunkText);

            if (voice) {
                utterance.voice = voice;
            }

            // slightly faster rate for long questions?
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onstart = () => setIsSpeaking(true);

            utterance.onend = () => {
                currentChunk++;
                speakNext();
            };

            utterance.onerror = (e) => {
                console.error("Speech synthesis error", e);
                // If it's just one chunk failing, maybe try next? 
                // But usually checking 'interrupted' or 'canceled' is needed.
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    setIsSpeaking(false);
                    configRef.current.onError?.('TTS Error');
                    // Try to recover by skipping to end?
                    // onEnd?.(); 
                }
            };

            synthesisRef.current.speak(utterance);
        };

        speakNext();
    }, []);

    const listen = useCallback((onResult: (transcript: string) => void) => {
        if (!recognitionRef.current) return;

        try {
            // If already listening, stop first? Or just ignore.
            // Best to abort current if any.
            recognitionRef.current.abort();

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognitionRef.current.start();
        } catch (e) {
            console.error("Failed to start listening", e);
        }
    }, []);

    const stopAll = useCallback(() => {
        if (synthesisRef.current) synthesisRef.current.cancel();
        if (recognitionRef.current) recognitionRef.current.abort();
        setIsSpeaking(false);
        setIsListening(false);
    }, []);

    return {
        speak,
        listen,
        stopAll,
        isSpeaking,
        isListening,
        supported,
        voices
    };
};
