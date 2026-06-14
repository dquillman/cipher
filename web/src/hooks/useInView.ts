import { useEffect, useRef, useState } from "react";

/**
 * One-shot "has this scrolled into view yet?" hook for scroll-reveal animations.
 *
 * Returns a ref to attach to the element and an `inView` flag that flips true
 * the first time the element intersects the viewport, then stops observing.
 *
 * Note: the OS reduce-motion preference is intentionally NOT honoured (owner
 * decision 2026-06-13) — reveals run for everyone. `inView` starts false and
 * flips on intersection; if IntersectionObserver is unavailable we reveal
 * immediately so content can never get stuck hidden.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return; // already revealed — nothing to watch
    // No IntersectionObserver (very old browsers) → reveal immediately so
    // content can never get stuck hidden.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
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
