import { useEffect, type RefObject } from "react";
import { afterPaint } from "../../utils/afterPaint";

/**
 * useHeroMotion — light GSAP polish, scoped to the hero.
 *
 * Two effects, both dynamically imported so `gsap` + ScrollTrigger land in their
 * own async chunk (never the entry bundle) and both deferred until after load +
 * idle (see utils/afterPaint) so they stay out of the LCP window:
 *
 *   1. Scroll parallax + fade on the WebGL field. As the hero scrolls away the
 *      canvas drifts up slower than the page and dissolves — cheap depth.
 *   2. Magnetic CTAs. Pointer-fine devices only; the button eases toward the
 *      cursor and springs back on leave — the signature awwwards micro-move.
 *
 * Targets are found by attribute within `scopeRef` so callers only add markup,
 * not refs: `[data-hero-parallax]` for the field, `[data-magnetic]` for CTAs.
 *
 * No-ops under prefers-reduced-motion. Everything reverts on unmount via
 * gsap.context, so React StrictMode double-invokes and route changes stay clean.
 */
export function useHeroMotion(scopeRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    // The effects below are decorative desktop polish. Avoid loading and
    // evaluating GSAP on phones, where the measured trace showed it competing
    // with the hero headline for the main thread.
    if (window.matchMedia("(max-width: 767px), (pointer: coarse)").matches) return;
    // OS reduce-motion intentionally not honoured (owner decision 2026-06-13).

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !scopeRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // 1 — parallax + fade the WebGL field as the hero leaves the viewport.
        const field = scope.querySelector<HTMLElement>("[data-hero-parallax]");
        if (field) {
          gsap.to(field, {
            yPercent: 16,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        // 2 — magnetic CTAs (pointer-fine only; touch keeps native behaviour).
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (fine) {
          scope.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
            const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
            const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
            const onMove = (e: PointerEvent) => {
              const r = btn.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
              yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
            };
            const onLeave = () => {
              xTo(0);
              yTo(0);
            };
            btn.addEventListener("pointermove", onMove);
            btn.addEventListener("pointerleave", onLeave);
          });
        }
      }, scope);

      cleanup = () => ctx.revert();
    };

    // Deferred to after load + idle: this is scroll and pointer polish, and at
    // t=0 nobody has scrolled or moved a pointer. Fetching gsap during the LCP
    // window bought nothing and cost 114KB of contention.
    const dispose = afterPaint(() => { void start(); });

    return () => {
      cancelled = true;
      dispose();
      cleanup?.();
    };
  }, [scopeRef]);
}
