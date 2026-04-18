import { Fragment, useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * EC-109: Usage Heatmap
 *
 * GitHub-style activity heatmap showing quiz activity over the last 16 weeks.
 * Each cell = one day, colored by question count.
 */

interface DayCell {
    date: string;       // YYYY-MM-DD
    count: number;
    dayOfWeek: number;  // 0=Sun
}

const WEEKS = 16;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getIntensityClass(count: number): string {
    if (count === 0) return 'bg-slate-800/60';
    if (count <= 2)  return 'bg-emerald-900/60';
    if (count <= 5)  return 'bg-emerald-700/70';
    if (count <= 10) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
}

function buildGrid(): DayCell[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back to the start of the grid (WEEKS * 7 days, aligned to Sunday)
    const endDay = new Date(today);
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - (WEEKS * 7 - 1) - startDay.getDay());

    const cells: DayCell[] = [];
    const cursor = new Date(startDay);

    while (cursor <= endDay) {
        cells.push({
            date: cursor.toISOString().slice(0, 10),
            count: 0,
            dayOfWeek: cursor.getDay(),
        });
        cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
}

function getMonthLabels(cells: DayCell[]): { label: string; col: number }[] {
    const labels: { label: string; col: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;
    let col = 0;

    for (let i = 0; i < cells.length; i++) {
        if (cells[i].dayOfWeek === 0) {
            const month = new Date(cells[i].date).getMonth();
            if (month !== lastMonth) {
                labels.push({ label: months[month], col });
                lastMonth = month;
            }
            col++;
        }
    }
    return labels;
}

interface UsageHeatmapProps {
    examId?: string;
}

export default function UsageHeatmap({ examId }: UsageHeatmapProps) {
    const [cells, setCells] = useState<DayCell[]>(() => buildGrid());
    const [loading, setLoading] = useState(true);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [activeDays, setActiveDays] = useState(0);
    const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }

        const fetchActivity = async () => {
            try {
                const runsRef = collection(db, 'quizRuns', uid, 'runs');
                let runs: any[];

                try {
                    const q = examId
                        ? query(runsRef, where('examId', '==', examId), where('status', '==', 'completed'), limit(1000))
                        : query(runsRef, where('status', '==', 'completed'), limit(1000));
                    const snap = await getDocs(q);
                    runs = snap.docs.map(d => d.data());
                } catch {
                    // Fallback if index missing
                    const q = query(runsRef, where('status', '==', 'completed'), limit(1000));
                    const snap = await getDocs(q);
                    runs = snap.docs.map(d => d.data());
                    if (examId) runs = runs.filter((r: any) => r.examId === examId);
                }

                // Build a date -> question count map
                const dateCounts: Record<string, number> = {};
                for (const run of runs) {
                    const ts = run.completedAt?.seconds
                        ? run.completedAt.seconds * 1000
                        : run.completedAt?.toMillis?.()
                            ? run.completedAt.toMillis()
                            : null;
                    if (!ts) continue;
                    const dateStr = new Date(ts).toISOString().slice(0, 10);
                    const questionCount = run.answers?.length || run.snapshot?.questionIds?.length || 1;
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + questionCount;
                }

                // Merge into grid
                const grid = buildGrid();
                let total = 0;
                let active = 0;
                for (const cell of grid) {
                    cell.count = dateCounts[cell.date] || 0;
                    total += cell.count;
                    if (cell.count > 0) active++;
                }

                setCells(grid);
                setTotalQuestions(total);
                setActiveDays(active);
            } catch (err) {
                console.error('UsageHeatmap: Failed to fetch activity', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [examId]);

    // Organize cells into columns (weeks)
    const weeks: DayCell[][] = [];
    let currentWeek: DayCell[] = [];
    for (const cell of cells) {
        if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(cell);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const monthLabels = getMonthLabels(cells);

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 md:p-6 h-full flex flex-col">
                <div className="h-32 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4 md:p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-white font-display">Study Activity</h3>
                    <p className="text-sm text-slate-400">Your practice activity over the last {WEEKS} weeks</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">
                        <span className="font-bold text-white">{totalQuestions}</span> questions
                    </span>
                    <span className="text-slate-400">
                        <span className="font-bold text-white">{activeDays}</span> active days
                    </span>
                </div>
            </div>

            {/* Heatmap grid — stretches to fill card width */}
            <div className="w-full">
                <div className="flex flex-col gap-0 w-full">
                    {/* Main grid: 1 col for day labels + 16 cols for weeks */}
                    <div
                        className="grid w-full"
                        style={{
                            gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)`,
                            columnGap: '3px',
                            rowGap: '3px',
                        }}
                    >
                        {/* Row 1: month labels (blank cell for day-label column, then month labels) */}
                        <div />
                        {weeks.map((_, wi) => {
                            const label = monthLabels.find(m => m.col === wi)?.label || '';
                            return (
                                <div key={`month-${wi}`} className="text-xs text-slate-500 font-medium whitespace-nowrap mb-1">
                                    {label}
                                </div>
                            );
                        })}

                        {/* Rows 2-8: one row per day-of-week */}
                        {[0, 1, 2, 3, 4, 5, 6].map(dow => (
                            <Fragment key={`row-${dow}`}>
                                {/* Day label */}
                                <div className="text-xs text-slate-500 w-8 text-right pr-1 flex items-center justify-end">
                                    {DAY_LABELS[dow]}
                                </div>
                                {/* Cells for this row */}
                                {weeks.map((week, wi) => {
                                    const cell = week.find(c => c.dayOfWeek === dow);
                                    if (!cell) {
                                        return <div key={`empty-${wi}-${dow}`} style={{ aspectRatio: '1 / 1' }} />;
                                    }
                                    return (
                                        <div
                                            key={cell.date}
                                            className={`w-full rounded-sm transition-colors cursor-default ${getIntensityClass(cell.count)} hover:ring-1 hover:ring-white/30`}
                                            style={{ aspectRatio: '1 / 1' }}
                                            onMouseEnter={() => setHoveredCell(cell)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        />
                                    );
                                })}
                            </Fragment>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-2 mt-3 ml-9">
                        <span className="text-xs text-slate-500">Less</span>
                        {[0, 1, 3, 6, 11].map(n => (
                            <div key={n} className={`w-3 h-3 rounded-sm ${getIntensityClass(n)}`} />
                        ))}
                        <span className="text-xs text-slate-500">More</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredCell && (
                <div className="mt-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                        {new Date(hoveredCell.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {' — '}
                    {hoveredCell.count === 0
                        ? 'No activity'
                        : `${hoveredCell.count} question${hoveredCell.count === 1 ? '' : 's'} practiced`
                    }
                </div>
            )}
        </div>
    );
}
