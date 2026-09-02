/**
 * What a mock score does and does not tell a candidate.
 *
 * The app used to print a green PASSED or a red FAILED from one hardcoded
 * `percentage >= 70`, with no idea which exam was being sat, while the landing
 * page sold that as "a real pass/fail against the actual passing bar".
 *
 * That claim cannot be honoured, and inventing per-exam percentages would not
 * fix it. CompTIA scores on a SCALED 100-900 range — 750 for SY0-701, 720 for
 * N10-009, 700 for 220-1202 — and the scaling is not published, so no
 * percentage of our questions converts to it. PMI publishes no passing
 * percentage for the PMP at all; it reports performance bands.
 *
 * So we report our own benchmark, say plainly that it is ours, and tell the
 * candidate what the real bar actually is. One threshold, one label, one place
 * — the previous code had a green "on track to pass" banner at >= 65 sitting
 * directly above a red FAILED badge at < 70, so every score from 65 to 69
 * contradicted itself on one screen.
 */

/** Our benchmark, deliberately not called a pass mark. */
export const BENCHMARK = 75;

export type ReadinessBand = 'on-track' | 'close' | 'not-yet';

export function bandFor(percentage: number): ReadinessBand {
    if (percentage >= BENCHMARK) return 'on-track';
    if (percentage >= BENCHMARK - 10) return 'close';
    return 'not-yet';
}

export const BAND_LABEL: Record<ReadinessBand, string> = {
    'on-track': 'ON TRACK',
    'close': 'CLOSE',
    'not-yet': 'NOT YET',
};

/** How the real exam is actually scored, per bank. Empty string means we have
 *  nothing published to cite, and we say that rather than guessing. */
export function realBarNote(examName?: string): string {
    const n = (examName || '').toLowerCase();
    if (n.includes('security+')) return 'CompTIA scores Security+ on a scaled 100–900 range and passes at 750. That scale is not published, so no percentage here converts to it.';
    if (n.includes('network+')) return 'CompTIA scores Network+ on a scaled 100–900 range and passes at 720. That scale is not published, so no percentage here converts to it.';
    if (n.includes('a+')) return 'CompTIA scores A+ Core 2 on a scaled 100–900 range and passes at 700. That scale is not published, so no percentage here converts to it.';
    if (n.includes('pmp')) return 'PMI does not publish a passing percentage for the PMP. It reports performance bands per domain rather than a single cut score.';
    return 'The certifying body scores the real exam on its own scale, which we cannot reproduce here.';
}
