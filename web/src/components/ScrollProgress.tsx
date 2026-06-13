import { useEffect, useState } from "react";

/**
 * Thin brand-gradient bar pinned at the very top, tracking page-scroll
 * progress. Passive scroll indicator (rAF-throttled) — not autonomous motion,
 * so it's fine under reduced-motion. Sits above the sticky nav (z-60).
 */
export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-blue-400 to-violet-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
