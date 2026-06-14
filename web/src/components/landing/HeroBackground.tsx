import { Suspense, lazy, useEffect, useState } from "react";

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
 *   - the user prefers reduced motion,
 *   - WebGL is unavailable,
 *   - we haven't mounted on the client yet (so prerender/SSR HTML is unaffected).
 */

const HeroCanvas = lazy(() => import("./HeroCanvas"));

function canRunWebGL(): boolean {
  if (typeof window === "undefined") return false;
  // OS reduce-motion intentionally not honoured (owner decision 2026-06-13) —
  // the WebGL hero runs whenever WebGL is available.
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroBackground({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canRunWebGL());
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <HeroCanvas className={className} />
    </Suspense>
  );
}
