import { useEffect, useRef, useState } from "react";

/**
 * One-shot "has this scrolled into view yet?" hook for scroll-reveal animations.
 *
 * Returns a ref to attach to the element and an `inView` flag that flips true
 * the first time the element intersects the viewport, then stops observing.
 *
 * Reduced-motion safe: when the user prefers reduced motion, `inView` starts
 * true (synchronously, before first paint) so reveal animations collapse to
 * "always shown" with no transition — and so prerendered/SSR HTML captures the
 * content fully visible. Callers drive the actual animation off `inView`.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (inView) return; // reduced-motion, or already revealed — nothing to watch
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, inView]);

  return { ref, inView };
}
