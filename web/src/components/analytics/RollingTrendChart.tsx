import { useState, useEffect, useRef, useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer
} from 'recharts';
import type { TrendDataPoint } from '../../services/performanceTrendService';

interface QuizScore {
    completedAt: number;
    scorePercent: number;
}

interface RollingTrendChartProps {
    data: TrendDataPoint[];
    color: string;
    height?: number;
    loading?: boolean;
    emptyMessage?: string;
    compact?: boolean;
    quizScores?: QuizScore[];
}

export default function RollingTrendChart({
    data,
    color,
    height = 300,
    loading = false,
    emptyMessage = 'Not enough data yet.',
    compact = false,
    quizScores,
}: RollingTrendChartProps) {
    const [isChartReady, setIsChartReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            setIsChartReady(true);
        }, 250);

        if (!containerRef.current) return () => clearTimeout(safetyTimer);

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setIsChartReady(true);
                    clearTimeout(safetyTimer);
                    resizeObserver.disconnect();
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            clearTimeout(safetyTimer);
            resizeObserver.disconnect();
        };
    }, []);

    // Give each data point a unique key so Recharts v3 never collapses
    // duplicate date categories when resolving the tooltip's active index.
    // Merge quiz scores into nearest trend point when provided.
    // MUST be before early returns — React Rules of Hooks.
    const chartData = useMemo(() => {
        const base = data.map((d, i) => ({
            ...d,
            _idx: i,
            quizScore: undefined as number | undefined,
        }));
        if (quizScores?.length && base.length > 0) {
            for (const qs of quizScores) {
                let closestIdx = 0;
                let closestDiff = Infinity;
                for (let i = 0; i < base.length; i++) {
                    const diff = Math.abs(base[i].timestamp - qs.completedAt);
                    if (diff < closestDiff) {
                        closestDiff = diff;
                        closestIdx = i;
                    }
                }
                if (base[closestIdx].quizScore === undefined) {
                    base[closestIdx].quizScore = qs.scorePercent;
                }
            }
        }
        return base;
    }, [data, quizScores]);

    if (loading) {
        return <div className="w-full bg-slate-800/50 animate-pulse rounded-xl" style={{ height }} />;
    }

    if (data.length < 10) {
        return (
            <div
                className="w-full flex flex-col items-center justify-center text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50 px-4 text-center"
                style={{ height: compact ? 160 : height }}
            >
                <p className="font-medium text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div
            className="w-full relative overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50"
            style={{ height }}
        >
            <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                <div
                    ref={containerRef}
                    className={`${compact ? 'min-w-[240px] sm:min-w-[360px]' : 'min-w-[260px] sm:min-w-[400px] md:min-w-[600px]'} w-full h-full bg-slate-800/20 relative`}
                    style={{ minHeight: '100%' }}
                >
                    {isChartReady && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                            <ComposedChart
                                data={chartData}
                                margin={compact
                                    ? { top: 10, right: 10, bottom: 10, left: -10 }
                                    : { top: 20, right: 20, bottom: 20, left: 20 }
                                }
                            >
                                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                                <XAxis
  					dataKey="_idx"
  					type="number"
 					domain={['dataMin', 'dataMax']}
  					stroke="#94a3b8"
  					tick={{ fill: '#94a3b8', fontSize: compact ? 10 : 12 }}
  					tickLine={{ stroke: '#334155' }}
 					 axisLine={{ stroke: '#334155' }}
 					 tickFormatter={(value) => chartData[value]?.date ?? ''}
				/>	
                                <YAxis
                                    domain={[0, 100]}
                                    stroke={color}
                                    tick={{ fill: color, fontSize: compact ? 10 : 12 }}
                                    tickLine={{ stroke: '#334155' }}
                                    axisLine={{ stroke: '#334155' }}
                                    width={compact ? 30 : 50}
                                    {...(!compact && {
                                        label: { value: 'Rolling Avg (%)', angle: -90, position: 'insideLeft', fill: color, dy: 50 }
                                    })}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || payload.length === 0) return null;
                                        const entry = payload[0];
                                        if (!entry?.payload) return null;
                                        const point = entry.payload;
                                        const avg = point.rollingAverage;
                                        const win = point.windowSize;
                                        const quiz = point.quizScore;
                                        return (
                                            <div style={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '0.75rem',
                                                padding: '0.75rem 1rem',
                                            }}>
                                                <p style={{ color: '#94a3b8', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                                    {point.date ?? ''}
                                                </p>
                                                {avg != null && (
                                                    <p style={{ color: '#f1f5f9', fontWeight: 600 }}>
                                                        Rolling Avg: {avg}%{' '}
                                                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                                            (window: {win ?? 0})
                                                        </span>
                                                    </p>
                                                )}
                                                {quiz != null && (
                                                    <p style={{ color: '#38bdf8', fontWeight: 600, marginTop: '0.25rem' }}>
                                                        Quiz Score: {quiz}%
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                                <ReferenceLine
                                    y={65}
                                    stroke="#334155"
                                    strokeDasharray="6 4"
                                    label={!compact ? { value: '65%', fill: '#64748b', position: 'right', fontSize: 11 } : undefined}
                                />
                                <Bar
                                    dataKey="quizScore"
                                    name="Quiz Score"
                                    fill="#38bdf8"
                                    opacity={0.35}
                                    barSize={8}
                                    radius={[2, 2, 0, 0]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rollingAverage"
                                    name="Rolling Avg"
                                    stroke={color}
                                    strokeWidth={compact ? 2 : 2.5}
                                    dot={false}
                                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: color }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
