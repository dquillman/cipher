/**
 * Run `cb` after the page has finished loading AND the main thread goes idle.
 *
 * Why this exists: the landing page's decoration — the WebGL hero field
 * (three.js, 463KB) and the GSAP scroll/pointer polish (114KB) — were both
 * kicked off from a mount effect. Correct in principle (each is code-split and
 * loads in its own async chunk) but wrong in timing: mount happens during the
 * LCP window, so half a megabyte of JavaScript was downloading, parsing and
 * compiling shaders while the browser was still trying to paint the headline.
 *
 * None of it is needed at t=0. Nobody has scrolled yet, nobody has moved a
 * pointer yet, and the hero has a static /media/hero-ambient.jpg underneath it
 * that is what the visitor actually sees first. Deferring costs a beat of
 * fade-in and buys the whole LCP/TBT window back.
 *
 * Returns a disposer; call it from the effect cleanup.
 */
export function afterPaint(cb: () => void, timeout = 2500): () => void {
    let cancelled = false;
    let idleHandle: number | undefined;
    let timerHandle: number | undefined;

    const schedule = () => {
        if (cancelled) return;
        // Safari only shipped requestIdleCallback in 18.4, so keep a timer path.
        if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(
                () => { if (!cancelled) cb(); },
                { timeout },
            );
        } else {
            timerHandle = window.setTimeout(() => { if (!cancelled) cb(); }, 300);
        }
    };

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
        cancelled = true;
        window.removeEventListener('load', schedule);
        if (idleHandle !== undefined && typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(idleHandle);
        }
        if (timerHandle !== undefined) window.clearTimeout(timerHandle);
    };
}
