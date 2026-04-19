import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Brain, Info, X, Target, Sparkles } from 'lucide-react';
import { auth } from '../../firebase';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { BLOOM_LEVELS, BLOOM_DESCRIPTIONS, type BloomLevel } from '../../types/Bloom';
import {
    fetchBloomTrend,
    type BloomStatLine,
    type BloomGrid,
} from '../../services/bloomTrendService';
import BloomsPrimer, { BloomsPrimerModal } from '../BloomsPrimer';

interface Props {
    examId: string | null;
    /** Domains defined by the exam (columns). If empty, falls back to domains discovered in answer data. */
    examDomains?: string[];
}

/** Context passed into the cell-detail modal when a user clicks a cell. */
interface SelectedCell {
    level: BloomLevel;
    domain: string;
    correct: number;
    total: number;
    score: number;
}

/**
 * 2D Bloom × Domain heatmap.
 *
 *   rows    = 6 cognitive levels (Create at top → Remember at bottom)
 *   columns = exam domains
 *   cells   = accuracy % color-coded red/amber/green
 *
 * Every data cell is clickable — opens a modal that explains what the cell
 * means AND gives level-specific guidance on how to improve that score.
 */
export default function BloomHeatmap({ examId, examDomains = [] }: Props) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<BloomStatLine[]>(
        BLOOM_LEVELS.map(level => ({ level, correct: 0, total: 0, score: 0 }))
    );
    const [grid, setGrid] = useState<BloomGrid>(emptyClientGrid());
    const [dataDomains, setDataDomains] = useState<string[]>([]);
    const [untagged, setUntagged] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showPrimerModal, setShowPrimerModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !examId) return;
        setLoading(true);
        setError(null);
        fetchBloomTrend(uid, examId)
            .then(res => {
                setStats(res.stats);
                setGrid(res.grid);
                setDataDomains(res.domains);
                setUntagged(res.untagged);
                setTotalAnswered(res.totalAnswered);
            })
            .catch(err => {
                console.error('BloomHeatmap: failed to load', err);
                setError('Could not load Bloom statistics.');
            })
            .finally(() => setLoading(false));
    }, [examId]);

    // Prefer the exam's defined domains (stable columns), fall back to what was seen in answers.
    const columns: string[] = examDomains.length > 0 ? examDomains : dataDomains;

    const hasData = stats.some(s => s.total > 0);
    const hasGridData = columns.length > 0 && hasData;

    // Biggest gap = lowest-scoring individual cell (level × domain) from the visible grid.
    // Computing off `stats` instead would include Apply-level attempts that have no domain
    // tag — those don't appear in any cell, so the headline number wouldn't match what the
    // user sees in the grid.
    const weakestCell = findWeakestCell(grid, columns);
    const showGap = !!weakestCell && weakestCell.score < 75;

    // Render highest-cognitive-demand row first (Create at top), like Dave's mockup.
    const levelsTopDown = [...BLOOM_LEVELS].reverse();

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 md:p-6 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-1 flex-col sm:flex-row">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Brain className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white font-display">
                        Bloom's Taxonomy Heatmap
                    </h3>
                    <div className="relative">
                        <button
                            onClick={() => setShowPrimerModal(true)}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-slate-500 hover:text-indigo-300 transition-colors"
                            aria-label="What is Bloom's Taxonomy?"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        {showTooltip && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl z-10 pointer-events-none">
                                Every CIPHER question is tagged with its Bloom's level — the type of thinking it demands. <span className="text-indigo-300 font-medium">Click for full explainer.</span>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-600 rotate-45 -mt-1"></div>
                            </div>
                        )}
                    </div>
                </div>
                {showGap && weakestCell && (
                    <button
                        type="button"
                        onClick={() => setSelectedCell(weakestCell)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer"
                        title="Click for tips to improve this cell"
                    >
                        <span className="font-semibold">Biggest gap:</span> {weakestCell.level} × {weakestCell.domain} ({weakestCell.score}%)
                    </button>
                )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Accuracy by <span className="text-slate-200 font-medium">cognitive level</span> × <span className="text-slate-200 font-medium">domain</span>. <span className="text-slate-500">Click any cell for an explanation and tips to improve.</span>
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span className="ml-3 text-sm text-slate-400">Loading Bloom data…</span>
                </div>
            ) : error ? (
                <p className="text-sm text-red-400">{error}</p>
            ) : !hasData ? (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-indigo-400" />
                        <p className="text-sm text-slate-300">
                            Complete a few quizzes to build your Bloom's profile. In the meantime — here's how it works:
                        </p>
                    </div>
                    <BloomsPrimer variant="compact" showExamples={false} />
                </div>
            ) : !hasGridData ? (
                // We have answers but no domain tags on them (e.g. legacy data) — show 1D bars fallback.
                <BarFallback stats={stats} />
            ) : (
                <>
                    <HeatmapGrid
                        grid={grid}
                        columns={columns}
                        levelsTopDown={levelsTopDown}
                        onCellClick={setSelectedCell}
                    />
                    <Legend />
                </>
            )}

            {!loading && !error && hasData && (
                <p className="text-xs text-slate-500 mt-5">
                    Based on {totalAnswered.toLocaleString()} answered question{totalAnswered === 1 ? '' : 's'}
                    {untagged > 0 && ` — ${untagged} unclassified`}.
                </p>
            )}

            <BloomsPrimerModal
                isOpen={showPrimerModal}
                onClose={() => setShowPrimerModal(false)}
            />

            <BloomCellDetailModal
                cell={selectedCell}
                onClose={() => setSelectedCell(null)}
            />
        </div>
    );
}

/* ---------- Heatmap grid ---------- */

interface HeatmapGridProps {
    grid: BloomGrid;
    columns: string[];
    levelsTopDown: BloomLevel[];
    onCellClick: (cell: SelectedCell) => void;
}

function HeatmapGrid({ grid, columns, levelsTopDown, onCellClick }: HeatmapGridProps) {
    // Use CSS grid: first col = level label, then one col per domain.
    const templateCols = `minmax(96px, 120px) repeat(${columns.length}, minmax(72px, 1fr))`;

    return (
        <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-fit">
                {/* Column headers */}
                <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: templateCols }}>
                    <div />
                    {columns.map(dom => (
                        <div
                            key={dom}
                            className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider text-center px-1 py-1 truncate"
                            title={dom}
                        >
                            {dom}
                        </div>
                    ))}
                </div>

                {/* Rows: one per level, top-down = hardest first */}
                {levelsTopDown.map(level => {
                    const row = grid[level] || {};
                    return (
                        <div
                            key={level}
                            className="grid gap-1.5 mb-1.5 items-stretch"
                            style={{ gridTemplateColumns: templateCols }}
                        >
                            <div
                                className="flex flex-col justify-center text-xs md:text-sm text-slate-200 font-medium pr-2 truncate"
                                title={BLOOM_DESCRIPTIONS[level]}
                            >
                                <span className="truncate">{level}</span>
                                <span className="text-[10px] text-slate-500 truncate hidden md:inline">
                                    {BLOOM_DESCRIPTIONS[level]}
                                </span>
                            </div>
                            {columns.map(dom => {
                                const cell = row[dom];
                                const total = cell?.total ?? 0;
                                const score = cell?.score ?? 0;
                                const correct = cell?.correct ?? 0;
                                return (
                                    <HeatCell
                                        key={dom}
                                        score={score}
                                        total={total}
                                        correct={correct}
                                        onClick={
                                            total > 0
                                                ? () => onCellClick({ level, domain: dom, correct, total, score })
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface HeatCellProps {
    score: number;
    total: number;
    correct: number;
    onClick?: () => void;
}

function HeatCell({ score, total, correct, onClick }: HeatCellProps) {
    if (total === 0) {
        return (
            <div
                className="rounded-md border border-slate-700/60 bg-slate-800/40 h-14 md:h-16 flex items-center justify-center text-slate-600 text-xs"
                title="No questions answered in this cell yet"
            >
                —
            </div>
        );
    }

    const { bg, border, text } = cellTone(score);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border ${bg} ${border} h-14 md:h-16 flex flex-col items-center justify-center transition-all hover:scale-[1.04] hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 cursor-pointer`}
            title={`${correct}/${total} correct — click to see how to improve`}
        >
            <span className={`font-bold text-sm md:text-base tabular-nums ${text}`}>{score}%</span>
            <span className="text-[10px] text-slate-400/80 tabular-nums">{correct}/{total}</span>
        </button>
    );
}

/**
 * Red → amber → green based on accuracy.
 * Uses full Tailwind class names (no dynamic templates) so JIT picks them up.
 */
function cellTone(score: number): { bg: string; border: string; text: string } {
    if (score >= 85) return { bg: 'bg-emerald-500/25', border: 'border-emerald-500/50', text: 'text-emerald-200' };
    if (score >= 75) return { bg: 'bg-green-500/20',   border: 'border-green-500/40',   text: 'text-green-200' };
    if (score >= 65) return { bg: 'bg-yellow-500/20',  border: 'border-yellow-500/40',  text: 'text-yellow-200' };
    if (score >= 50) return { bg: 'bg-orange-500/20', border: 'border-orange-500/40',  text: 'text-orange-200' };
    return                   { bg: 'bg-red-500/25',    border: 'border-red-500/50',    text: 'text-red-200' };
}

function Legend() {
    const items: Array<{ label: string; bg: string; border: string }> = [
        { label: '< 50%',   bg: 'bg-red-500/25',     border: 'border-red-500/50' },
        { label: '50–64%',  bg: 'bg-orange-500/20',  border: 'border-orange-500/40' },
        { label: '65–74%',  bg: 'bg-yellow-500/20',  border: 'border-yellow-500/40' },
        { label: '75–84%',  bg: 'bg-green-500/20',   border: 'border-green-500/40' },
        { label: '85%+',    bg: 'bg-emerald-500/25', border: 'border-emerald-500/50' },
    ];
    return (
        <div className="flex items-center gap-2 flex-wrap mt-4 text-[10px] md:text-xs text-slate-400">
            <span className="text-slate-500">Legend:</span>
            {items.map(it => (
                <span key={it.label} className="flex items-center gap-1.5">
                    <span className={`inline-block w-3 h-3 rounded-sm border ${it.bg} ${it.border}`} />
                    <span>{it.label}</span>
                </span>
            ))}
        </div>
    );
}

/* ---------- Fallback: 1D bars when no domain data ---------- */

function BarFallback({ stats }: { stats: BloomStatLine[] }) {
    return (
        <div>
            <p className="text-xs text-slate-500 mb-3">
                No per-domain data on your answers yet — showing overall accuracy by level. Take more quizzes to unlock the full grid.
            </p>
            <div className="space-y-3">
                {stats.map(b => {
                    const hasQuestions = b.total > 0;
                    const barColor = hasQuestions
                        ? `hsl(${Math.min(b.score * 1.2, 120)}, 85%, 45%)`
                        : 'transparent';
                    return (
                        <div key={b.level} className={hasQuestions ? '' : 'opacity-40'}>
                            <div className="flex justify-between items-baseline text-sm mb-1 gap-4">
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <span className="text-slate-200 font-medium">{b.level}</span>
                                    <span className="text-xs text-slate-500 truncate hidden sm:inline">
                                        {BLOOM_DESCRIPTIONS[b.level]}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 shrink-0">
                                    <span className="text-slate-400 text-xs">
                                        {b.correct}/{b.total}
                                    </span>
                                    <span className="text-white font-semibold tabular-nums">
                                        {hasQuestions ? `${b.score}%` : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: hasQuestions ? `${b.score}%` : '0%',
                                        backgroundColor: barColor,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------- Cell detail modal ---------- */

interface BloomCellDetailModalProps {
    cell: SelectedCell | null;
    onClose: () => void;
}

function BloomCellDetailModal({ cell, onClose }: BloomCellDetailModalProps) {
    const navigate = useNavigate();
    const { isPro } = useSubscription();
    const drillSize = isPro ? 10 : 5;

    // Close on Escape
    useEffect(() => {
        if (!cell) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cell, onClose]);

    if (!cell) return null;

    const startFocusedDrill = () => {
        onClose();
        navigate('/app/quiz', {
            state: {
                filterDomain: cell.domain,
                filterBloomLevel: cell.level,
                mode: 'smart',
            },
        });
    };

    const { level, domain, correct, total, score } = cell;
    const tone = cellTone(score);
    const verdict = scoreVerdict(score);
    const tips = LEVEL_TIPS[level];
    const whatItMeans = cellMeaning(level, domain);

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`${level} in ${domain}`}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-3 border-b border-slate-800">
                    <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                            Cognitive heatmap cell
                        </div>
                        <h2 className="text-2xl font-bold text-white font-display">
                            {level} <span className="text-slate-500 font-normal">×</span> {domain}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{BLOOM_DESCRIPTIONS[level]}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-200 transition-colors -mt-1 -mr-1 shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Score block */}
                <div className="p-6 pt-5 border-b border-slate-800">
                    <div className="flex items-baseline gap-4 flex-wrap">
                        <div className={`px-4 py-2 rounded-xl border ${tone.bg} ${tone.border}`}>
                            <div className={`text-3xl font-bold tabular-nums ${tone.text}`}>{score}%</div>
                            <div className="text-[10px] text-slate-400 tabular-nums">{correct} of {total} correct</div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className={`text-sm font-semibold ${tone.text}`}>{verdict.headline}</div>
                            <p className="text-sm text-slate-400 leading-relaxed mt-1">{verdict.body}</p>
                        </div>
                    </div>
                </div>

                {/* What this means */}
                <div className="p-6 pt-5 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">What this measures</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{whatItMeans}</p>
                </div>

                {/* How to improve */}
                <div className="p-6 pt-5">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                        How to improve <span className="text-indigo-300 normal-case font-medium">{level}</span> skill
                    </h3>
                    <ul className="space-y-2.5">
                        {tips.map((tip, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                                <span className="shrink-0 w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {idx + 1}
                                </span>
                                <span><span className="text-white font-semibold">{tip.title}.</span> {tip.body}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-5 rounded-xl bg-slate-800/60 border border-slate-700/60 overflow-hidden">
                        <div className="p-4 pb-3">
                            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                                Pro move
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Run a focused drill on <span className="text-white font-medium">{domain}</span> questions
                                at the <span className="text-white font-medium">{level}</span> level.
                                {isPro
                                    ? ' Ten focused reps on the exact cell you\'re weak in beats a hundred generic questions.'
                                    : ' Five focused reps on the exact cell you\'re weak in beats a hundred generic questions.'}
                            </p>
                            {!isPro && (
                                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                                    <Sparkles className="w-3 h-3" />
                                    Upgrade to Pro for 10-question drills
                                </div>
                            )}
                        </div>
                        <button
                            onClick={startFocusedDrill}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors border-t border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-inset"
                        >
                            <Target className="w-4 h-4" />
                            Start {drillSize}-Question Drill — {domain} · {level}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ---------- Copy tables ---------- */

interface Tip { title: string; body: string; }

const LEVEL_TIPS: Record<BloomLevel, Tip[]> = {
    Remember: [
        { title: 'Active recall over re-reading', body: 'Close the book and write what you remember. Re-reading feels productive but doesn\'t build retrieval strength.' },
        { title: 'Spaced repetition', body: 'Use Anki or flashcards with expanding intervals (1d, 3d, 7d, 14d). Catches what you think you know but don\'t.' },
        { title: 'Lock down exact terminology', body: 'Wrong wording = wrong answer. Write the definition word-for-word from the official source, not your paraphrase.' },
        { title: 'Mnemonics for lists and sequences', body: 'Acronyms, memory palaces, rhymes. Anything that turns arbitrary order into structure.' },
    ],
    Understand: [
        { title: 'Teach it back out loud', body: 'Explain the concept to an imaginary beginner without notes. Where you stumble is where your model is shallow.' },
        { title: 'Draw the relationships', body: 'Concept maps and diagrams force you to show how things connect, not just what they are.' },
        { title: 'Build analogies to what you already know', body: '"It\'s like X, except…" anchors new ideas to existing ones. Makes recall and transfer both easier.' },
        { title: 'Summarize in your own words', body: 'If you can only restate the textbook verbatim, you\'re at Remember, not Understand. Rewrite the chapter in 3 sentences.' },
    ],
    Apply: [
        { title: 'Drill scenario questions, not definitions', body: 'Apply-level questions give you a situation. Practice reading for the signal — what\'s the key fact that determines the answer?' },
        { title: 'Build an "if-then" playbook', body: 'For every wrong answer, write: "If I see [signal], the answer is [action]." Turns scattered cases into a decision tree.' },
        { title: 'Timed reps', body: 'Pressure changes how you think. Simulate exam conditions — countdown timer, no pausing, no lookups.' },
        { title: 'Autopsy every miss', body: 'Don\'t just read the explanation. Ask: which rule did I misapply? Would I make this mistake again tomorrow?' },
    ],
    Analyze: [
        { title: 'Compare and contrast grids', body: 'Put two similar concepts or options side-by-side in a table. Force yourself to name 3 ways they differ.' },
        { title: 'Kill the distractors', body: 'For every question, explain why each wrong answer is wrong. Analyze-level questions punish skipping this step.' },
        { title: 'Break scenarios into parts', body: 'Big cases compress multiple sub-decisions. Split the question into its component judgments — answer each separately.' },
        { title: 'Look for patterns across misses', body: 'If you keep blowing the same kind of Analyze question, there\'s a structural gap in how you\'re reading — not just missing facts.' },
    ],
    Evaluate: [
        { title: 'Justify every option, not just your pick', body: 'Write one sentence for each choice explaining its tradeoff. Evaluate questions reward defending a ranking, not guessing.' },
        { title: 'Red-team your own answer', body: 'After picking A, argue for B. If the counter-argument is strong, you didn\'t actually evaluate — you preferred.' },
        { title: 'Rank by explicit criteria', body: 'Cost vs quality vs risk vs speed. Name the axes the question cares about, then rank options on each.' },
        { title: 'Study case retrospectives', body: 'Real-world "what went wrong and what should they have chosen" cases build the judgment muscle better than textbook drills.' },
    ],
    Create: [
        { title: 'Design, don\'t copy', body: 'Given a prompt, sketch your own plan before looking at the answer. The gap between yours and theirs is the lesson.' },
        { title: 'Combine frameworks', body: 'Create questions reward synthesis. Practice mashing two tools together — e.g., risk response + stakeholder analysis — into one plan.' },
        { title: 'Open-ended practice', body: 'Write mini-scenarios and draft your own mitigation or design. No answer key — just self-grade against principles.' },
        { title: 'Build, then critique, then rebuild', body: 'First draft is fast. Second pass kills weak parts. Third pass is defensible. Create skill is iteration, not inspiration.' },
    ],
};

function cellMeaning(level: BloomLevel, domain: string): string {
    const levelFrame: Record<BloomLevel, string> = {
        Remember: `recall specific facts, terms, and definitions from`,
        Understand: `explain concepts and interpret information from`,
        Apply: `use knowledge in a new scenario drawn from`,
        Analyze: `break problems into parts and identify relationships within`,
        Evaluate: `judge options and justify decisions in`,
        Create: `design, synthesize, or produce original work in`,
    };
    return `This cell tracks your accuracy on questions that ask you to ${levelFrame[level]} the ${domain} domain. A low score here means you can't reliably ${level.toLowerCase()} inside ${domain} — regardless of whether you know other levels or other domains.`;
}

function scoreVerdict(score: number): { headline: string; body: string } {
    if (score >= 85) return {
        headline: 'Mastery zone',
        body: 'You\'re exam-ready on this cell. Maintain with light spaced repetition and move your study time to weaker cells.',
    };
    if (score >= 75) return {
        headline: 'Solid, not yet bulletproof',
        body: 'Good but not safe. Exam-day pressure tends to pull 75% down — push this to 85%+ before test day.',
    };
    if (score >= 65) return {
        headline: 'Shaky ground',
        body: 'You know some of it, but you\'re coin-flipping on harder questions. This is where focused, level-specific drills pay off most.',
    };
    if (score >= 50) return {
        headline: 'Real gap',
        body: 'Below 65% means the pattern isn\'t locked in yet. Slow down — understand each miss before taking more questions.',
    };
    return {
        headline: 'High-priority weakness',
        body: 'This cell is dragging your overall score. Prioritize it — ten focused reps here will move your total more than a hundred generic questions.',
    };
}

/* ---------- local helpers ---------- */

function emptyClientGrid(): BloomGrid {
    const g = {} as BloomGrid;
    for (const level of BLOOM_LEVELS) g[level] = {};
    return g;
}

/**
 * Walk the 2D grid and find the lowest-scoring cell (level × domain).
 * Uses a volume threshold so a 0/1 fluke doesn't hijack the callout.
 *
 * Returns the same shape as SelectedCell so the user can click the callout
 * and jump straight to the detail modal for that cell.
 */
function findWeakestCell(grid: BloomGrid, columns: string[]): SelectedCell | null {
    // Prefer cells with >= 5 attempts. If none qualify, fall back to cells with >= 3.
    // If still nothing, fall back to anything with data.
    const candidates: SelectedCell[] = [];
    for (const level of BLOOM_LEVELS) {
        const row = grid[level] || {};
        for (const domain of columns) {
            const c = row[domain];
            if (!c || c.total === 0) continue;
            candidates.push({ level, domain, correct: c.correct, total: c.total, score: c.score });
        }
    }
    if (candidates.length === 0) return null;

    const thresholds = [5, 3, 1];
    for (const min of thresholds) {
        const filtered = candidates.filter(c => c.total >= min);
        if (filtered.length > 0) {
            filtered.sort((a, b) => a.score - b.score || b.total - a.total);
            return filtered[0];
        }
    }
    return null;
}
