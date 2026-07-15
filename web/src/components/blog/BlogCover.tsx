/**
 * Bespoke, on-brand cover art for each blog post — Decoder identity (ink
 * ground, signal cyan, verify amber, geometric/mono motifs). Inline SVG:
 * zero extra network requests, crisp at any size, theme-consistent.
 *
 * Adding a new post? Add a variant here and reference its key from the post's
 * `cover` field in Blog.tsx (the field is required, so the build enforces it).
 */
export type BlogCoverKey =
    | 'reasoning-frames'
    | 'heatmap'
    | 'plateau'
    | 'blooms'
    | 'thirty-days'
    | 'ai-explain'
    | 'five-mistakes'
    | 'confusing';

const INK = '#0B1526';
const LINE = '#1B2A44';
const CYAN = '#43E5FF';
const CYAN_DIM = '#2A6E82';
const AMBER = '#FFB224';
const GREEN = '#34D399';
const RED = '#F87171';
const FAINT = '#3C5170';

function Frame({ id, glow, children }: { id: string; glow: string; children: React.ReactNode }) {
    return (
        <svg viewBox="0 0 480 190" className="w-full h-full" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
            <defs>
                <radialGradient id={`${id}-bg`} cx="30%" cy="0%" r="120%">
                    <stop offset="0%" stopColor={glow} />
                    <stop offset="60%" stopColor={INK} />
                    <stop offset="100%" stopColor="#060B16" />
                </radialGradient>
                <pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M32 0H0V32" fill="none" stroke={LINE} strokeWidth="1" opacity="0.5" />
                </pattern>
            </defs>
            <rect width="480" height="190" fill={`url(#${id}-bg)`} />
            <rect width="480" height="190" fill={`url(#${id}-grid)`} opacity="0.6" />
            {children}
        </svg>
    );
}

export default function BlogCover({ variant, className = '' }: { variant: BlogCoverKey; className?: string }) {
    const inner = (() => {
        switch (variant) {
            // "How Certification Exams Think" — a reasoning-frame lattice with a
            // resolved cyan node and scramble glyphs decoding into it.
            case 'reasoning-frames':
                return (
                    <Frame id="rf" glow="#12314a">
                        {[[120, 60], [210, 40], [300, 80], [250, 130], [150, 120], [360, 55]].map(([x, y], i, a) => (
                            <g key={i}>
                                {a.slice(i + 1).map(([x2, y2], j) => (
                                    <line key={j} x1={x} y1={y} x2={x2} y2={y2} stroke={LINE} strokeWidth="1.2" opacity="0.7" />
                                ))}
                            </g>
                        ))}
                        {[[120, 60], [210, 40], [250, 130], [150, 120], [360, 55]].map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="5" fill={INK} stroke={FAINT} strokeWidth="1.5" />
                        ))}
                        <circle cx="300" cy="80" r="10" fill={CYAN} opacity="0.18" />
                        <circle cx="300" cy="80" r="6" fill={CYAN} />
                        <text x="392" y="120" fontFamily="ui-monospace, monospace" fontSize="26" fontWeight="700" fill={CYAN} opacity="0.85">λΦ◇</text>
                        <text x="392" y="150" fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="3" fill={FAINT}>DECODE</text>
                    </Frame>
                );

            // "Cognitive Heatmap" — a literal accuracy heatmap grid.
            case 'heatmap': {
                const vals = [0.9, 0.8, 0.55, 0.7, 0.35, 0.6, 0.85, 0.5, 0.3, 0.75, 0.45, 0.65, 0.4, 0.9, 0.6, 0.25];
                const color = (v: number) => (v >= 0.7 ? GREEN : v >= 0.45 ? AMBER : RED);
                return (
                    <Frame id="hm" glow="#12314a">
                        {vals.map((v, i) => {
                            const c = i % 8, r = Math.floor(i / 8);
                            return <rect key={i} x={120 + c * 34} y={55 + r * 34} width="28" height="28" rx="5" fill={color(v)} opacity={0.25 + v * 0.6} />;
                        })}
                        <text x="120" y="45" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2.5" fill={FAINT}>ACCURACY · BY DOMAIN × BLOOM</text>
                    </Frame>
                );
            }

            // "Recall-Only Prep Fails" — a curve that rises then plateaus below
            // the dashed pass line.
            case 'plateau':
                return (
                    <Frame id="pl" glow="#2a1f0a">
                        <line x1="60" y1="60" x2="420" y2="60" stroke={AMBER} strokeWidth="1.5" strokeDasharray="6 6" opacity="0.7" />
                        <text x="424" y="64" fontFamily="ui-monospace, monospace" fontSize="11" fill={AMBER} opacity="0.8">PASS</text>
                        <polyline points="60,150 110,120 160,95 210,82 260,80 320,80 400,79" fill="none" stroke={CYAN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="400" cy="79" r="5" fill={CYAN} />
                        <text x="300" y="105" fontFamily="ui-monospace, monospace" fontSize="12" letterSpacing="1" fill={FAINT}>~70% · stalled</text>
                    </Frame>
                );

            // "Study by Bloom's Level" — a six-tier cognitive pyramid.
            case 'blooms':
                return (
                    <Frame id="bl" glow="#12314a">
                        {[0, 1, 2, 3, 4, 5].map((i) => {
                            const y = 40 + i * 22;
                            const inset = 90 - i * 15;
                            const t = i / 5;
                            const col = i >= 4 ? CYAN : i >= 2 ? CYAN_DIM : FAINT;
                            return (
                                <polygon key={i}
                                    points={`${240 - inset + 15},${y} ${240 + inset - 15},${y} ${240 + inset},${y + 20} ${240 - inset},${y + 20}`}
                                    fill={col} opacity={0.35 + t * 0.5} stroke={INK} strokeWidth="2" />
                            );
                        })}
                        <text x="392" y="150" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2" fill={FAINT}>L1→L6</text>
                    </Frame>
                );

            // "First 30 Days" — a 30-cell calendar with a filling streak.
            case 'thirty-days':
                return (
                    <Frame id="td" glow="#12314a">
                        {Array.from({ length: 30 }).map((_, i) => {
                            const c = i % 10, r = Math.floor(i / 10);
                            const done = i < 12;
                            return <rect key={i} x={90 + c * 30} y={55 + r * 30} width="22" height="22" rx="5"
                                fill={done ? CYAN : INK} opacity={done ? 0.35 + (i / 30) * 0.5 : 1}
                                stroke={done ? CYAN : FAINT} strokeWidth="1.5" />;
                        })}
                        <text x="90" y="45" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2.5" fill={FAINT}>DAY 1 → 30</text>
                    </Frame>
                );

            // "How AI Explanations Change Study" — an explanation card with a
            // spark and a "WHY" tag.
            case 'ai-explain':
                return (
                    <Frame id="ai" glow="#0c2a2440">
                        <rect x="110" y="55" width="230" height="80" rx="12" fill="#0E1E30" stroke={LINE} strokeWidth="1.5" />
                        <text x="126" y="80" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2" fill={CYAN}>WHY</text>
                        <line x1="126" y1="96" x2="300" y2="96" stroke={FAINT} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
                        <line x1="126" y1="110" x2="270" y2="110" stroke={FAINT} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
                        <line x1="126" y1="124" x2="240" y2="124" stroke={FAINT} strokeWidth="4" strokeLinecap="round" opacity="0.25" />
                        <g transform="translate(348,60)">
                            <path d="M0,-14 L4,-4 L14,0 L4,4 L0,14 L-4,4 L-14,0 L-4,-4 Z" fill={CYAN} />
                        </g>
                    </Frame>
                );

            // "5 Study Mistakes" — a big 5 with red X markers.
            case 'five-mistakes':
                return (
                    <Frame id="fm" glow="#2a1414">
                        <text x="120" y="150" fontFamily="'Segoe UI', system-ui, sans-serif" fontSize="140" fontWeight="800" fill={CYAN} opacity="0.9">5</text>
                        {[[250, 60], [300, 95], [270, 135], [340, 70], [330, 120]].map(([x, y], i) => (
                            <g key={i} stroke={RED} strokeWidth="3.5" strokeLinecap="round" opacity="0.85">
                                <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
                                <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} />
                            </g>
                        ))}
                    </Frame>
                );

            // "Why Questions Are So Confusing" — four options with tangled
            // connectors, one resolving to the correct (cyan) answer.
            case 'confusing':
                return (
                    <Frame id="cf" glow="#12314a">
                        {['A', 'B', 'C', 'D'].map((L, i) => {
                            const y = 50 + i * 30;
                            const right = i === 2;
                            return (
                                <g key={i}>
                                    <rect x="90" y={y - 13} width="150" height="26" rx="13" fill={right ? '#0e2a26' : '#0E1E30'} stroke={right ? GREEN : LINE} strokeWidth="1.5" />
                                    <text x="104" y={y + 4} fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill={right ? GREEN : FAINT}>{L}</text>
                                </g>
                            );
                        })}
                        {/* tangled connectors */}
                        <path d="M240,50 C320,60 300,150 380,110" fill="none" stroke={AMBER} strokeWidth="1.5" opacity="0.55" />
                        <path d="M240,80 C310,90 320,55 380,110" fill="none" stroke={FAINT} strokeWidth="1.5" opacity="0.55" />
                        <path d="M240,110 C300,110 340,110 380,110" fill="none" stroke={GREEN} strokeWidth="2.5" opacity="0.9" />
                        <path d="M240,140 C320,130 310,90 380,110" fill="none" stroke={FAINT} strokeWidth="1.5" opacity="0.5" />
                        <circle cx="380" cy="110" r="7" fill={GREEN} opacity="0.2" />
                        <circle cx="380" cy="110" r="4" fill={GREEN} />
                        <text x="352" y="150" fontFamily="ui-monospace, monospace" fontSize="26" fill={CYAN} opacity="0.5">?</text>
                    </Frame>
                );
        }
    })();

    return <div className={className}>{inner}</div>;
}
