import { useEffect, useRef, useState } from 'react';

const GLYPHS = '△◇#%&λΞΦ$◈≠∅01';
const FRAME_MS = 32;
const FRAMES = 46;          // ~1.5s to fully resolve
const REPLAY_MS = 12000;    // re-run the decode so the page keeps its signature moment

/**
 * Cipher-glyph scramble that resolves into `text`, left to right, with a
 * blinking caret. SEO/prerender-safe: the initial render is the plain final
 * text; scrambling starts only after mount. Runs regardless of OS
 * reduce-motion (owner decision 2026-06-13, see EC-030 note in index.css).
 */
export default function DecodeWord({ text }: { text: string }) {
    const [display, setDisplay] = useState(text);
    const timers = useRef<number[]>([]);

    useEffect(() => {
        // Prerender/E2E guard: the sitemap prerenderer (Playwright) snapshots the
        // DOM mid-animation, which would bake scramble glyphs into the static H1
        // and wreck its SEO text. Automated browsers keep the plain word.
        if (navigator.webdriver) return;

        const run = () => {
            let frame = 0;
            const iv = window.setInterval(() => {
                frame++;
                const solved = Math.floor((frame / FRAMES) * text.length);
                let out = '';
                for (let i = 0; i < text.length; i++) {
                    out += i < solved ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
                }
                setDisplay(out);
                if (frame >= FRAMES) {
                    setDisplay(text);
                    window.clearInterval(iv);
                }
            }, FRAME_MS);
            timers.current.push(iv);
        };

        run();
        const replay = window.setInterval(run, REPLAY_MS);
        timers.current.push(replay);
        return () => { timers.current.forEach(t => window.clearInterval(t)); timers.current = []; };
    }, [text]);

    // Only ONE copy of the word may exist in the text content at rest.
    //
    // The first version of this fix rendered an sr-only <span>{text}</span>
    // alongside the aria-hidden glyph span. Both are text nodes, so the h1's
    // text content became "Learn How Certification Exams ThinkThink" — which is
    // exactly what Google reads, and what the prerendered HTML shipped.
    //
    // So swap, never stack. While the scramble is running the real word lives in
    // the sr-only span and the glyphs are hidden from assistive tech. At rest —
    // which is the initial render, the prerendered output, and every moment
    // between runs — there is no sr-only span at all and the single visible span
    // is not hidden, so the word appears exactly once to both readers and
    // crawlers. (aria-label on a bare span, the original bug, names nothing: a
    // generic element has no accessible name to label, so axe flags it and the
    // word could be announced as nothing at all.)
    const scrambling = display !== text;

    return (
        <span className="decode-word">
            {scrambling && <span className="sr-only">{text}</span>}
            <span aria-hidden={scrambling || undefined}>{display}</span>
            <span className="decode-caret" aria-hidden="true" />
        </span>
    );
}
