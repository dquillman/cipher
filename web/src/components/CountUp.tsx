import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Counts the leading integer of `value` up from 0 once it scrolls into view.
 * Non-numeric values (e.g. "AI") render static; a trailing suffix ("7 days")
 * is preserved. Reduced-motion / SSR → final value immediately (useInView
 * seeds inView=true under reduced motion, and we short-circuit the rAF).
 */
export default function CountUp({
  value,
  durationMs = 1300,
  className = "",
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const m = value.match(/^(\d[\d,]*)(.*)$/);
  const target = m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
  const suffix = m ? m[2] : "";
  const [n, setN] = useState<number | null>(target);

  useEffect(() => {
    if (target === null || !inView) return;
    // OS reduce-motion intentionally not honoured (owner decision 2026-06-13).
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      setN(Math.round((1 - Math.pow(1 - t, 3)) * target)); // easeOutCubic
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, durationMs]);

  if (target === null) {
    return <span ref={ref} className={className}>{value}</span>;
  }
  return <span ref={ref} className={className}>{n}{suffix}</span>;
}
