import { Suspense, lazy, useEffect, useState } from "react";
import { afterPaint } from "../../utils/afterPaint";

/**
 * HeroBackground — the gate + mount point for the WebGL hero field.
 *
 * This component is intentionally tiny (no `three`). It decides whether the
 * heavy canvas should run at all, then lazy-loads it so `three` is fetched in
 * its own async chunk only when the gate opens — keeping the entry bundle and
 * every non-hero route untouched.
 *
 * The gate stays closed (render nothing, let the static /media/hero-ambient.jpg
 * fallback show through) when:
 *   - WebGL is unavailable,
 *   - we haven't mounted on the client yet (so prerender/SSR HTML is unaffected).
 *
 * The gate also waits for load + idle (see utils/afterPaint) so the canvas
 * never competes with first paint.
 */

const HeroCanvas = lazy(() => import("./HeroCanvas"));

function canRunWebGL(): boolean {
  if (typeof window === "undefined") return false;
  // OS reduce-motion intentionally not honoured (owner decision 2026-06-13) —
  // the WebGL hero runs whenever WebGL is available.
  try {
    const c = document.createElement("canvas");
    const context = c.getContext("webgl2") || c.getContext("webgl");
    // The probe is never rendered. Release its GPU allocation before the real
    // hero creates a context, especially on memory-constrained phones.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!context;
  } catch {
    return false;
  }
}

export default function HeroBackground({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  // Deferred to after load + idle. Opening the gate on mount meant three.js
  // (463KB) downloaded, parsed and compiled its shaders inside the LCP window,
  // for an effect layered on top of a static image the visitor already sees.
  useEffect(() => afterPaint(() => setEnabled(canRunWebGL())), []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <HeroCanvas className={className} />
    </Suspense>
  );
}
