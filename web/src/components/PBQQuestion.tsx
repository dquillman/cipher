import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, X, Terminal, GripVertical, ArrowDown, ArrowUp } from 'lucide-react';

/* ───────────────────────────────────────────────────────────────
   PBQ (Performance-Based Question) Component
   Supports 4 subtypes that mirror real CompTIA exam PBQs:
     • drag-drop  — place items into labelled zones
     • fill-table — complete a config table (dropdowns)
     • order-steps — arrange steps in correct sequence
     • command     — type commands in a simulated terminal
   ─────────────────────────────────────────────────────────────── */

// ─── Shared types ───────────────────────────────────────────────

export type PBQType = 'drag-drop' | 'fill-table' | 'order-steps' | 'command';

export interface DragDropZone { id: string; label: string }
export interface DragDropItem { id: string; label: string; correctZone: string }
export interface DragDropConfig { zones: DragDropZone[]; items: DragDropItem[] }

export interface FillTableRow {
    label: string;
    fields: { correctValue: string; options: string[] }[];
}
export interface FillTableConfig { columns: string[]; rows: FillTableRow[] }

export interface OrderStepsConfig { steps: string[] /* correct order */ }

export interface CommandConfig {
    prompt: string;           // e.g. "C:\>"
    scenario: string;         // what the user needs to accomplish
    /** Each entry is one acceptable answer sequence.
     *
     *  Firestore rejects an array stored directly inside another array
     *  ("invalid nested entity"), so a persisted config carries each sequence
     *  as { steps: [...] }. Locally-authored configs may still use the plain
     *  string[][] form. Read them through commandSequences(), never directly —
     *  this mismatch is why no PBQ could be written to the bank before. */
    acceptedCommands: (string[] | { steps: string[] })[];
    hints?: string[];
}

export interface PBQConfig {
    pbqType: PBQType;
    dragDrop?: DragDropConfig;
    fillTable?: FillTableConfig;
    orderSteps?: OrderStepsConfig;
    command?: CommandConfig;
}

// ─── State that Quiz.tsx will manage ────────────────────────────

export interface PBQState {
    pbqType: PBQType;
    // drag-drop
    placements?: Record<string, string>;       // itemId → zoneId
    // fill-table
    tableValues?: string[][];                   // [row][col]
    // order-steps
    stepOrder?: number[];                       // indices into original steps array (shuffled)
    // command
    commandHistory?: string[];
    currentInput?: string;
}

export function initPBQState(config: PBQConfig): PBQState {
    const base: PBQState = { pbqType: config.pbqType };

    switch (config.pbqType) {
        case 'drag-drop':
            base.placements = {};
            break;
        case 'fill-table': {
            const rows = config.fillTable!.rows.length;
            const cols = config.fillTable!.columns.length;
            base.tableValues = Array.from({ length: rows }, () => Array(cols).fill(''));
            break;
        }
        case 'order-steps': {
            const indices = config.orderSteps!.steps.map((_, i) => i);
            // Fisher-Yates shuffle
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            base.stepOrder = indices;
            break;
        }
        case 'command':
            base.commandHistory = [];
            base.currentInput = '';
            break;
    }
    return base;
}

/** Normalises acceptedCommands to sequences, whichever shape it was stored in. */
export function commandSequences(config: CommandConfig): string[][] {
    return (config.acceptedCommands || []).map(seq =>
        Array.isArray(seq) ? seq : (seq?.steps ?? [])
    );
}

export function scorePBQ(config: PBQConfig, state: PBQState): { correct: number; total: number } {
    switch (config.pbqType) {
        case 'drag-drop': {
            const items = config.dragDrop!.items;
            const placements = state.placements || {};
            let correct = 0;
            for (const item of items) {
                if (placements[item.id] === item.correctZone) correct++;
            }
            return { correct, total: items.length };
        }
        case 'fill-table': {
            const rows = config.fillTable!.rows;
            let correct = 0;
            let total = 0;
            rows.forEach((row, ri) => {
                row.fields.forEach((field, ci) => {
                    total++;
                    if ((state.tableValues?.[ri]?.[ci] || '').toLowerCase().trim() === field.correctValue.toLowerCase().trim()) {
                        correct++;
                    }
                });
            });
            return { correct, total };
        }
        case 'order-steps': {
            const order = state.stepOrder || [];
            let correct = 0;
            order.forEach((v, i) => { if (v === i) correct++; });
            return { correct, total: order.length };
        }
        case 'command': {
            const history = (state.commandHistory || []).map(c => c.toLowerCase().trim());
            const accepted = commandSequences(config.command!);
            const matched = accepted.some(seq => {
                if (seq.length !== history.length) return false;
                return seq.every((cmd, i) => history[i] === cmd.toLowerCase().trim());
            });
            return { correct: matched ? 1 : 0, total: 1 };
        }
    }
}

export function isPBQCorrect(config: PBQConfig, state: PBQState): boolean {
    const { correct, total } = scorePBQ(config, state);
    return correct === total;
}

// ─── Display-order shuffle ──────────────────────────────────────

/* order-steps has always shuffled (initPBQState, above). drag-drop and
 * fill-table did not, and rendered config.items / config.zones / field.options
 * in authored array order — so any seed whose author listed items in zone
 * order, or whose correct option sat at the row's own index, handed those
 * marks to a candidate who never read the question. Auditing the first
 * Security+ PBQ set found 43 of 133 scored decisions (32%) recoverable from
 * layout alone: a zero-knowledge candidate exploiting only that scored 50%.
 *
 * Both ends are fixed. Seeds are authored de-correlated, and the order is
 * shuffled again here so a leaked seed file is not an answer key either.
 * Shuffling is display-only — placements are keyed by item id and table cells
 * are compared by value, so scorePBQ is untouched.
 *
 * The shuffle is held in a ref keyed by content, so it survives re-renders
 * (a re-shuffle on every keystroke would make the pool unusable) and is
 * recomputed when a different question arrives. */
function shuffleCopy<T>(input: T[]): T[] {
    const a = input.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function useShuffledOnce<T>(input: T[], key: string): T[] {
    const ref = useRef<{ key: string; value: T[] } | null>(null);
    if (!ref.current || ref.current.key !== key) {
        ref.current = { key, value: shuffleCopy(input) };
    }
    return ref.current.value;
}

/** fill-table needs a shuffle per dropdown, and hooks cannot be called inside
 *  the row/field loops. One cache, keyed by the option list itself: identical
 *  option lists share an order, which is what a real form does anyway. */
function useOptionShuffler(): (options: string[]) => string[] {
    const cache = useRef<Map<string, string[]> | null>(null);
    if (cache.current === null) cache.current = new Map();
    return useCallback((options: string[]) => {
        const map = cache.current!;
        const key = options.join(' ');
        const hit = map.get(key);
        if (hit) return hit;
        const shuffled = shuffleCopy(options);
        map.set(key, shuffled);
        return shuffled;
    }, []);
}

// ─── Props ──────────────────────────────────────────────────────

interface PBQQuestionProps {
    config: PBQConfig;
    state: PBQState;
    locked: boolean;
    onChange: (state: PBQState) => void;
}

// ─── Main Component ─────────────────────────────────────────────

export default function PBQQuestion({ config, state, locked, onChange }: PBQQuestionProps) {
    switch (config.pbqType) {
        case 'drag-drop':
            return <DragDropPBQ config={config.dragDrop!} state={state} locked={locked} onChange={onChange} />;
        case 'fill-table':
            return <FillTablePBQ config={config.fillTable!} state={state} locked={locked} onChange={onChange} />;
        case 'order-steps':
            return <OrderStepsPBQ config={config.orderSteps!} state={state} locked={locked} onChange={onChange} />;
        case 'command':
            return <CommandPBQ config={config.command!} state={state} locked={locked} onChange={onChange} />;
    }
}

// ─── 1. DRAG-DROP ───────────────────────────────────────────────

function DragDropPBQ({ config, state, locked, onChange }: {
    config: DragDropConfig; state: PBQState; locked: boolean; onChange: (s: PBQState) => void;
}) {
    const placements = state.placements || {};
    const items = useShuffledOnce(config.items, config.items.map(i => i.id).join(' '));
    const zones = useShuffledOnce(config.zones, config.zones.map(z => z.id).join(' '));
    const unplaced = items.filter(item => !placements[item.id]);
    const [dragging, setDragging] = useState<string | null>(null);

    const handlePlace = (itemId: string, zoneId: string) => {
        if (locked) return;
        onChange({ ...state, placements: { ...placements, [itemId]: zoneId } });
    };

    const handleRemove = (itemId: string) => {
        if (locked) return;
        const next = { ...placements };
        delete next[itemId];
        onChange({ ...state, placements: next });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PBQ — Drag & Drop
                </span>
            </div>

            <p className="text-sm text-slate-400">
                {locked ? 'Review the placements below.' : 'Drag items from the pool into the correct zone, or tap an item then tap a zone.'}
            </p>

            {/* Item Pool */}
            {!locked && unplaced.length > 0 && (
                <div className="p-3 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Available Items</p>
                    <div className="flex flex-wrap gap-2">
                        {unplaced.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setDragging(dragging === item.id ? null : item.id)}
                                className={`px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all ${
                                    dragging === item.id
                                        ? 'bg-brand-500/20 border-brand-500 text-brand-300 ring-2 ring-brand-500/40'
                                        : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:border-brand-400'
                                } border cursor-pointer`}
                            >
                                <GripVertical className="w-3 h-3 inline mr-1 opacity-50" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Zones */}
            <div className="grid gap-3 sm:grid-cols-2">
                {zones.map(zone => {
                    const zoneItems = items.filter(item => placements[item.id] === zone.id);
                    const isDropTarget = dragging && !locked;

                    return (
                        <div
                            key={zone.id}
                            onClick={() => {
                                if (dragging && !locked) {
                                    handlePlace(dragging, zone.id);
                                    setDragging(null);
                                }
                            }}
                            className={`rounded-xl border-2 p-3 transition-all min-h-[80px] ${
                                isDropTarget
                                    ? 'border-brand-400/60 bg-brand-500/5 cursor-pointer'
                                    : 'border-slate-700 bg-slate-800/40'
                            }`}
                        >
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                {zone.label}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {zoneItems.map(item => {
                                    const isCorrect = locked && item.correctZone === zone.id;
                                    const isWrong = locked && item.correctZone !== zone.id;
                                    return (
                                        <span
                                            key={item.id}
                                            onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[44px] rounded-lg text-sm font-medium ${
                                                isCorrect ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' :
                                                isWrong ? 'bg-red-500/10 text-red-300 border border-red-500/40' :
                                                'bg-slate-700/60 text-slate-200 border border-slate-600 hover:border-red-400 cursor-pointer'
                                            }`}
                                        >
                                            {locked && isCorrect && <Check className="w-3 h-3" />}
                                            {locked && isWrong && <X className="w-3 h-3" />}
                                            {item.label}
                                        </span>
                                    );
                                })}
                                {zoneItems.length === 0 && (
                                    <span className="text-xs text-slate-600 italic">
                                        {isDropTarget ? 'Tap to place here' : 'Empty'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Corrections after submit */}
            {locked && (
                <CorrectionsPanel config={config} placements={placements} />
            )}
        </div>
    );
}

function CorrectionsPanel({ config, placements }: { config: DragDropConfig; placements: Record<string, string> }) {
    const wrong = config.items.filter(item => placements[item.id] !== item.correctZone);
    if (wrong.length === 0) return null;

    return (
        <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <p className="text-sm font-medium text-slate-300 mb-2">Correct placements:</p>
            <div className="space-y-1.5">
                {wrong.map(item => {
                    const correctZone = config.zones.find(z => z.id === item.correctZone);
                    return (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="text-indigo-400 font-medium">{item.label}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-emerald-400">{correctZone?.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── 2. FILL-TABLE ──────────────────────────────────────────────

function FillTablePBQ({ config, state, locked, onChange }: {
    config: FillTableConfig; state: PBQState; locked: boolean; onChange: (s: PBQState) => void;
}) {
    const values = state.tableValues || [];
    const shuffleOptions = useOptionShuffler();

    const handleChange = (rowIdx: number, colIdx: number, value: string) => {
        if (locked) return;
        const next = values.map(r => [...r]);
        next[rowIdx][colIdx] = value;
        onChange({ ...state, tableValues: next });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    PBQ — Configuration
                </span>
            </div>

            <p className="text-sm text-slate-400">
                {locked ? 'Review the correct configuration below.' : 'Select the correct value for each setting.'}
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-800/80">
                            <th className="text-left px-3 sm:px-4 py-3 text-slate-400 font-medium border-b border-slate-700">Setting</th>
                            {config.columns.map((col, ci) => (
                                <th key={ci} className="text-left px-3 sm:px-4 py-3 text-slate-400 font-medium border-b border-slate-700">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {config.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-slate-700/50 last:border-0">
                                <td className="px-3 sm:px-4 py-3 text-slate-300 font-medium">{row.label}</td>
                                {row.fields.map((field, ci) => {
                                    const val = values[ri]?.[ci] || '';
                                    const isCorrect = locked && val.toLowerCase().trim() === field.correctValue.toLowerCase().trim();
                                    const isWrong = locked && val !== '' && !isCorrect;
                                    const isEmpty = locked && val === '';

                                    return (
                                        <td key={ci} className="px-3 sm:px-4 py-3">
                                            {field.options ? (
                                                <select
                                                    value={val}
                                                    onChange={(e) => handleChange(ri, ci, e.target.value)}
                                                    disabled={locked}
                                                    className={`w-full px-3 py-2 min-h-[44px] rounded-lg border text-base sm:text-sm bg-slate-800 transition-colors ${
                                                        isCorrect ? 'border-emerald-500/60 text-emerald-300' :
                                                        isWrong || isEmpty ? 'border-red-500/40 text-red-300' :
                                                        'border-slate-600 text-slate-200 hover:border-brand-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30'
                                                    }`}
                                                >
                                                    <option value="">— Select —</option>
                                                    {shuffleOptions(field.options).map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => handleChange(ri, ci, e.target.value)}
                                                    disabled={locked}
                                                    placeholder="Enter value..."
                                                    className={`w-full px-3 py-2 min-h-[44px] rounded-lg border text-base sm:text-sm bg-slate-800 transition-colors ${
                                                        isCorrect ? 'border-emerald-500/60 text-emerald-300' :
                                                        isWrong || isEmpty ? 'border-red-500/40 text-red-300' :
                                                        'border-slate-600 text-slate-200 placeholder:text-slate-600 hover:border-brand-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30'
                                                    }`}
                                                />
                                            )}
                                            {locked && (isWrong || isEmpty) && (
                                                <p className="text-xs text-emerald-400 mt-1">Correct: {field.correctValue}</p>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── 3. ORDER-STEPS ─────────────────────────────────────────────

function OrderStepsPBQ({ config, state, locked, onChange }: {
    config: OrderStepsConfig; state: PBQState; locked: boolean; onChange: (s: PBQState) => void;
}) {
    const order = state.stepOrder || [];
    const [selected, setSelected] = useState<number | null>(null);

    const handleSwap = useCallback((idx: number) => {
        if (locked) return;
        if (selected === null) {
            setSelected(idx);
        } else {
            if (selected !== idx) {
                const next = [...order];
                [next[selected], next[idx]] = [next[idx], next[selected]];
                onChange({ ...state, stepOrder: next });
            }
            setSelected(null);
        }
    }, [selected, order, onChange, locked, state]);

    const handleMoveUp = (idx: number) => {
        if (locked || idx === 0) return;
        const next = [...order];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        onChange({ ...state, stepOrder: next });
    };

    const handleMoveDown = (idx: number) => {
        if (locked || idx === order.length - 1) return;
        const next = [...order];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        onChange({ ...state, stepOrder: next });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    PBQ — Sequence
                </span>
            </div>

            <p className="text-sm text-slate-400">
                {locked ? 'Review the correct order below.' : 'Arrange the steps in the correct order. Tap two items to swap, or use the arrows.'}
            </p>

            <div className="space-y-2">
                {order.map((stepIdx, pos) => {
                    const isCorrectPos = locked && stepIdx === pos;
                    const isWrongPos = locked && stepIdx !== pos;
                    const isSelected = selected === pos;

                    let borderClass = 'border-slate-700 bg-slate-800/40';
                    if (isSelected) borderClass = 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/40';
                    if (isCorrectPos) borderClass = 'border-emerald-500/60 bg-emerald-500/5';
                    if (isWrongPos) borderClass = 'border-red-500/40 bg-red-500/5';

                    return (
                        <div
                            key={pos}
                            onClick={() => handleSwap(pos)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                                locked ? '' : 'cursor-pointer'
                            } ${borderClass}`}
                        >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isCorrectPos ? 'bg-emerald-600 text-white' :
                                isWrongPos ? 'bg-red-600/60 text-white' :
                                'bg-slate-700 text-slate-300'
                            }`}>
                                {pos + 1}
                            </span>

                            <span className={`flex-1 text-sm ${
                                isCorrectPos ? 'text-emerald-300' :
                                isWrongPos ? 'text-red-300/80' :
                                isSelected ? 'text-brand-300' :
                                'text-slate-200'
                            }`}>
                                {config.steps[stepIdx]}
                            </span>

                            {locked && isCorrectPos && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            {locked && isWrongPos && <X className="w-4 h-4 text-red-400 flex-shrink-0" />}

                            {!locked && (
                                /* These were p-0.5 around a 14px icon — roughly 18px of
                                   tappable area, and on touch they are the only way to
                                   reorder at all. 44px each. */
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveUp(pos); }}
                                        disabled={pos === 0}
                                        aria-label="Move step up"
                                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded hover:bg-slate-700 disabled:opacity-20 transition-colors"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveDown(pos); }}
                                        disabled={pos === order.length - 1}
                                        aria-label="Move step down"
                                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded hover:bg-slate-700 disabled:opacity-20 transition-colors"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Correct order after submit */}
            {locked && order.some((v, i) => v !== i) && (
                <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                    <p className="text-sm font-medium text-slate-300 mb-2">Correct order:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        {config.steps.map((step, i) => (
                            <li key={i} className="text-sm text-emerald-400">{step}</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// ─── 4. COMMAND TERMINAL ────────────────────────────────────────

function CommandPBQ({ config, state, locked, onChange }: {
    config: CommandConfig; state: PBQState; locked: boolean; onChange: (s: PBQState) => void;
}) {
    const history = state.commandHistory || [];
    const [input, setInput] = useState('');
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            const next = [...history, input.trim()];
            onChange({ ...state, commandHistory: next, currentInput: '' });
            setInput('');
        }
    };

    const handleClear = () => {
        onChange({ ...state, commandHistory: [], currentInput: '' });
        setInput('');
    };

    const isMatch = locked && commandSequences(config).some(seq => {
        if (seq.length !== history.length) return false;
        return seq.every((cmd, i) => history[i].toLowerCase().trim() === cmd.toLowerCase().trim());
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-green-500/20 text-green-400 border border-green-500/30">
                    PBQ — Command Line
                </span>
            </div>

            {/* Scenario description */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-sm text-slate-300">
                <p className="font-medium text-slate-200 mb-1">Scenario:</p>
                <p>{config.scenario}</p>
                {config.hints && config.hints.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                        <p className="font-medium">Hints:</p>
                        <ul className="list-disc list-inside mt-1">
                            {config.hints.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Terminal */}
            <div className="rounded-xl border-2 border-slate-700 bg-[#0d1117] overflow-hidden font-mono">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border-b border-slate-700">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-slate-400">Terminal</span>
                    {!locked && history.length > 0 && (
                        <button onClick={handleClear} className="ml-auto inline-flex items-center min-h-[44px] px-2 text-xs text-slate-500 hover:text-red-400 transition-colors">
                            Clear
                        </button>
                    )}
                </div>

                <div ref={terminalRef} className="p-4 max-h-[300px] overflow-y-auto space-y-1 text-sm">
                    {history.map((cmd, i) => (
                        <div key={i} className="flex gap-1">
                            <span className="text-green-400 flex-shrink-0">{config.prompt}</span>
                            <span className={locked ? (
                                isMatch ? 'text-emerald-300' : 'text-red-300/80'
                            ) : 'text-slate-200'}>
                                {cmd}
                            </span>
                        </div>
                    ))}

                    {!locked && (
                        <div className="flex gap-1 items-center">
                            <span className="text-green-400 flex-shrink-0">{config.prompt}</span>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                // No autoFocus on touch: it throws the software keyboard
                                // up over half the screen before the scenario has been
                                // read. The three off switches matter more — an Android
                                // keyboard will otherwise capitalise and autocorrect
                                // shell commands, so "ls -la" arrives as "Ls -la".
                                autoCapitalize="none"
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-1 bg-transparent text-slate-200 outline-none caret-green-400 text-base sm:text-sm min-h-[44px]"
                                placeholder="Type a command..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Result after submit */}
            {locked && (
                <div className={`p-4 rounded-xl border ${
                    isMatch ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {isMatch ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                        <p className={`text-sm font-medium ${isMatch ? 'text-emerald-300' : 'text-red-300'}`}>
                            {isMatch ? 'Correct commands!' : 'Incorrect — see accepted solution below'}
                        </p>
                    </div>
                    {!isMatch && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-800/60 font-mono text-sm">
                            {(commandSequences(config)[0] ?? []).map((cmd, i) => (
                                <div key={i} className="text-emerald-400">
                                    {config.prompt} <span className="text-slate-200">{cmd}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
