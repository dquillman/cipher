import { X } from 'lucide-react';
import { useEffect } from 'react';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS, type BloomLevel } from '../types/Bloom';
import { useInView } from '../hooks/useInView';

/**
 * Shared Bloom's Taxonomy primer — renders a color-coded 6-level
 * pyramid with a short explanation. Used on the Stats heatmap empty
 * state, inside the "What is Bloom's?" modal, on the Help page, and
 * on the marketing Landing page.
 *
 * Variants:
 *   - compact: small card / empty-state use
 *   - panel:   help page / landing section use (more breathing room)
 *   - hero:    large marketing-hero treatment
 */

export type BloomsPrimerVariant = 'compact' | 'panel' | 'hero';

interface BloomsPrimerProps {
    variant?: BloomsPrimerVariant;
    showExamples?: boolean;
    className?: string;
}

// Color tokens per level — lowest (Remember) → highest (Create).
// Rising warmth from teal/blue → amber → rose reflects rising cognitive demand.
const LEVEL_COLORS: Record<BloomLevel, { bg: string; border: string; text: string; bar: string }> = {
    Remember:   { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-300',     bar: 'bg-sky-500' },
    Understand: { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    text: 'text-cyan-300',    bar: 'bg-cyan-500' },
    Apply:      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', bar: 'bg-emerald-500' },
    Analyze:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-300',   bar: 'bg-amber-500' },
    Evaluate:   { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-300',  bar: 'bg-orange-500' },
    Create:     { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-300',    bar: 'bg-rose-500' },
};

// Concrete certification-exam-flavored examples — makes the abstract concrete.
const LEVEL_EXAMPLES: Record<BloomLevel, string> = {
    Remember:   '"What does SLA stand for?"',
    Understand: '"Explain the difference between Agile and Waterfall."',
    Apply:      '"Given this scenario, which risk response should the PM choose?"',
    Analyze:    '"Which two factors contributed most to the schedule slip?"',
    Evaluate:   '"Given these three options, which best balances cost and quality?"',
    Create:     '"Design a mitigation plan for this compound risk."',
};

export default function BloomsPrimer({
    variant = 'panel',
    showExamples = true,
    className = '',
}: BloomsPrimerProps) {
    const isHero = variant === 'hero';
    const isCompact = variant === 'compact';

    // Staggered scroll-reveal for the 6 level rows (reduced-motion → shown instantly).
    const { ref: levelsRef, inView } = useInView<HTMLDivElement>(0.2);

    return (
        <div className={`${className}`}>
            {/* Headline + description */}
            <div className={isCompact ? 'mb-4' : 'mb-6'}>
                <h3 className={`font-bold text-white font-display ${isHero ? 'text-3xl md:text-4xl' : isCompact ? 'text-base' : 'text-xl md:text-2xl'}`}>
                    What is Bloom's Taxonomy?
                </h3>
                <p className={`text-slate-400 leading-relaxed ${isHero ? 'text-lg mt-3' : isCompact ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
                    Six cognitive levels, ordered from simple recall to complex synthesis.
                    Benjamin Bloom published the framework in 1956 — it's the foundation of
                    how serious certifications are written. CIPHER tags every question with
                    its level so you can see <em className="text-slate-300">which kind of thinking</em> you're weak at,
                    not just which topics.
                </p>
            </div>

            {/* 6-level visual — rows sized proportionally from narrow (lowest cognitive demand) to widest.
                Each row rises + fades in on a stagger when the group scrolls into view. */}
            <div ref={levelsRef} className={isCompact ? 'space-y-1.5' : 'space-y-2'}>
                {BLOOM_LEVELS.map((level, idx) => {
                    const c = LEVEL_COLORS[level];
                    const widthPct = 40 + idx * 10; // 40%, 50%, 60%, 70%, 80%, 90%
                    return (
                        <div
                            key={level}
                            className={`flex items-center gap-3 ${c.bg} ${c.border} border rounded-lg ${isCompact ? 'p-2' : 'p-3'}`}
                            style={{
                                maxWidth: `${widthPct}%`,
                                opacity: inView ? 1 : 0,
                                transform: inView ? 'none' : 'translateY(14px)',
                                transition: `opacity 0.5s ease ${idx * 0.08}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s`,
                            }}
                        >
                            <div className={`shrink-0 w-8 h-8 rounded-md ${c.bar} flex items-center justify-center font-bold text-white text-sm`}>
                                {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className={`font-semibold ${c.text} ${isHero ? 'text-lg' : 'text-sm'}`}>
                                        {level}
                                    </span>
                                    <span className={`text-slate-400 ${isCompact ? 'text-xs' : 'text-xs md:text-sm'}`}>
                                        {BLOOM_DESCRIPTIONS[level]}
                                    </span>
                                </div>
                                {showExamples && !isCompact && (
                                    <p className="text-xs text-slate-500 italic mt-1 truncate">
                                        {LEVEL_EXAMPLES[level]}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isCompact && (
                <p className={`text-slate-500 ${isHero ? 'text-base mt-6' : 'text-xs mt-4'} leading-relaxed`}>
                    Most exam prep drills level 1 (Remember). Real certifications live
                    in levels 3–5 (Apply, Analyze, Evaluate). Seeing your accuracy per
                    level tells you exactly where your study method is breaking down.
                </p>
            )}
        </div>
    );
}

/**
 * Modal wrapper for BloomsPrimer — used on Stats when the user clicks
 * the Info icon next to the Bloom heatmap title.
 */
interface BloomsPrimerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BloomsPrimerModal({ isOpen, onClose }: BloomsPrimerModalProps) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="About Bloom's Taxonomy"
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        CIPHER's Core Differentiator
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-200 transition-colors -mt-1 -mr-1"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 pt-2">
                    <BloomsPrimer variant="panel" showExamples={true} />
                </div>
            </div>
        </div>
    );
}
