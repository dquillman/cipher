import { useInView } from "../../hooks/useInView";

/**
 * Animated inline version of /blog-images/blooms-pyramid.svg.
 *
 * Same geometry/copy as the static asset, but each tier is its own <g> so the
 * pyramid "builds" bottom-up (Remember → Create) when it scrolls into view —
 * reinforcing the article's point that the exam lives in the upper tiers.
 *
 * Animation is opacity-only (rock-solid across browsers for SVG groups) on a
 * reverse-index stagger. Reduced-motion / SSR → all tiers shown instantly
 * (useInView seeds inView=true), so the graphic never renders blank.
 */

type Tier = {
  poly: string;
  color: string;
  title: string;
  titleY: number;
  sub: string;
  subY: number;
};

// Source order is top (Create) → bottom (Remember), matching the SVG asset.
const TIERS: Tier[] = [
  { poly: "350,90 450,90 495,154.33 305,154.33", color: "#f87171", title: "6. Create", titleY: 120.17, sub: "Produce original work", subY: 138.17 },
  { poly: "305,158.33 495,158.33 540,222.67 260,222.67", color: "#fbbf24", title: "5. Evaluate", titleY: 188.5, sub: "Judge, choose BEST, justify", subY: 206.5 },
  { poly: "260,226.67 540,226.67 585,291 215,291", color: "#a78bfa", title: "4. Analyze", titleY: 256.83, sub: "Find priority, separate noise", subY: 274.83 },
  { poly: "215,295 585,295 630,359.33 170,359.33", color: "#7aa2ff", title: "3. Apply", titleY: 325.17, sub: "Use in a new situation", subY: 343.17 },
  { poly: "170,363.33 630,363.33 675,427.67 125,427.67", color: "#34d399", title: "2. Understand", titleY: 393.5, sub: "Explain in your own words", subY: 411.5 },
  { poly: "125,431.67 675,431.67 720,496 80,496", color: "#9fb0cc", title: "1. Remember", titleY: 461.83, sub: "Recall facts and terms", subY: 479.83 },
];

export default function BloomsPyramid({ className = "" }: { className?: string }) {
  const { ref, inView } = useInView<SVGSVGElement>(0.3);
  const last = TIERS.length - 1;

  return (
    <svg
      ref={ref}
      viewBox="0 0 800 560"
      className={className}
      role="img"
      aria-label="Bloom's Taxonomy pyramid showing six cognitive levels, with the top three (Apply, Analyze, Evaluate, Create) highlighted as where the exam lives"
    >
      <defs>
        <linearGradient id="bloomPyramidBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#0f1830" />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="url(#bloomPyramidBg)" />
      <text x="400" y="42" fill="#e5ecf7" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700" textAnchor="middle">
        Bloom's Taxonomy — the framework behind your exam
      </text>

      {TIERS.map((t, i) => (
        <g
          key={t.title}
          style={{
            opacity: inView ? 1 : 0,
            // Bottom tier (Remember, last) reveals first; Create (top) last.
            transition: `opacity 0.5s ease ${(last - i) * 0.12}s`,
          }}
        >
          <polygon points={t.poly} fill={t.color} fillOpacity={0.18} stroke={t.color} strokeWidth={1.5} />
          <text x="400" y={t.titleY} fill="#e5ecf7" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="700" textAnchor="middle">
            {t.title}
          </text>
          <text x="400" y={t.subY} fill="#9fb0cc" fontFamily="Inter, sans-serif" fontSize="12" textAnchor="middle">
            {t.sub}
          </text>
        </g>
      ))}

      {/* Side annotations fade in after the tiers finish building. */}
      <g style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease 0.85s" }}>
        <text x="50" y="110" fill="#f87171" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700">WHERE THE EXAM LIVES</text>
        <text x="50" y="492" fill="#9fb0cc" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700">WHERE FLASHCARDS LIVE</text>
        <line x1="44" y1="116" x2="44" y2="482" stroke="#9fb0cc" strokeOpacity="0.3" strokeWidth="1" />
      </g>
    </svg>
  );
}
