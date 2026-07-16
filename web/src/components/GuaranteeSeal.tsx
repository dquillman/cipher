import { useId, type CSSProperties } from 'react';

interface GuaranteeSealProps {
    /** Rendered pixel size (square). Default 160. */
    size?: number;
    /** Tilt in degrees, like a sticker slapped on. Default -12. */
    tilt?: number;
    /** Stamp the seal in on mount (scale + settle). Honours reduced-motion. */
    animate?: boolean;
    className?: string;
}

/**
 * The gold "60-Day Money-Back Guarantee" seal — a physical-sticker look that
 * sits on marketing surfaces and pricing. Deliberately off the Decoder palette:
 * a warm gold badge reads as premium reassurance against the cool cyan brand.
 * Kept as inline SVG (no external asset) so it scales crisply and themes cleanly.
 */
export default function GuaranteeSeal({
    size = 160,
    tilt = -12,
    animate = false,
    className = '',
}: GuaranteeSealProps) {
    const gid = useId();
    const goldId = `seal-gold-${gid}`;

    // Starburst edge — 44 spikes alternating between two radii.
    const spikes = 44;
    const outer = 98;
    const inner = 90;
    let pts = '';
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        pts += `${(100 + r * Math.cos(a)).toFixed(2)},${(100 + r * Math.sin(a)).toFixed(2)} `;
    }

    const star = (x: number, y: number, s: number) => (
        <path
            transform={`translate(${x},${y}) scale(${s})`}
            d="M0,-5 L1.5,-1.5 L5,-1.5 L2,1 L3,5 L0,2.5 L-3,5 L-2,1 L-5,-1.5 L-1.5,-1.5 Z"
            fill="#4A3000"
        />
    );

    return (
        <div
            className={`${animate ? 'seal-stamp-in ' : ''}${className}`}
            style={{
                width: size,
                height: size,
                transform: `rotate(${tilt}deg)`,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))',
                '--seal-tilt': `${tilt}deg`,
            } as CSSProperties}
            aria-label="60-day money-back guarantee"
            role="img"
        >
            <style>{`
                @keyframes seal-stamp {
                    0%   { opacity: 0; transform: rotate(-42deg) scale(1.9); }
                    55%  { opacity: 1; transform: rotate(calc(var(--seal-tilt) + 5deg)) scale(0.94); }
                    75%  { transform: rotate(calc(var(--seal-tilt) - 2deg)) scale(1.03); }
                    100% { opacity: 1; transform: rotate(var(--seal-tilt)) scale(1); }
                }
                .seal-stamp-in { animation: seal-stamp 0.9s cubic-bezier(0.2,1.3,0.4,1) both; }
                @media (prefers-reduced-motion: reduce) {
                    .seal-stamp-in { animation: none !important; }
                }
            `}</style>
            <svg viewBox="0 0 200 200" width="100%" height="100%">
                <defs>
                    <radialGradient id={goldId} cx="38%" cy="30%" r="78%">
                        <stop offset="0%" stopColor="#FFF3C8" />
                        <stop offset="40%" stopColor="#FFC93C" />
                        <stop offset="78%" stopColor="#E29A0E" />
                        <stop offset="100%" stopColor="#A96C00" />
                    </radialGradient>
                </defs>
                <polygon points={pts.trim()} fill="#B87B00" />
                <circle cx="100" cy="100" r="88" fill={`url(#${goldId})`} />
                <circle cx="100" cy="100" r="80" fill="none" stroke="#5A3C00" strokeWidth="2.5" opacity="0.9" />
                <circle cx="100" cy="100" r="75" fill="none" stroke="#7A5200" strokeWidth="1.2" strokeDasharray="1.5 5" opacity="0.75" />
                {star(100, 44, 1.5)}
                {star(80, 49, 1)}
                {star(120, 49, 1)}
                <g fill="#3A2600" textAnchor="middle" fontFamily="'Clash Display', 'Segoe UI', system-ui, sans-serif">
                    <path d="M100 60 l15 5.5 v10 c0 11 -7.5 17.5 -15 21 c-7.5 -3.5 -15 -10 -15 -21 v-10 z" fill="#3A2600" />
                    <path d="M93.5 77 l4.5 4.5 l9.5 -10.5" fill="none" stroke="#FFC93C" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="100" y="126" fontSize="33" fontWeight="900" letterSpacing="-1">60-DAY</text>
                    <text x="100" y="145" fontSize="15" fontWeight="800" letterSpacing="1.5">MONEY-BACK</text>
                    <text x="100" y="160" fontSize="15" fontWeight="800" letterSpacing="1.5">GUARANTEE</text>
                    <text x="100" y="175" fontSize="8.5" fontWeight="700" letterSpacing="2.5" opacity="0.8">NO CONDITIONS</text>
                </g>
            </svg>
        </div>
    );
}
