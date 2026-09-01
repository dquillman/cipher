/**
 * Never let a network write hold the UI hostage.
 *
 * Several places awaited a Firestore write before advancing the screen:
 * Quiz.handleNext awaited saveProgress before moving to the next question,
 * the diagnostic's Exit button awaited completeRun before navigating away, and
 * useSimulator.submitExam awaited two writes before showing results.
 *
 * All three were wrapped in try/catch, which handles a REJECTED promise. It
 * does nothing for one that never settles — and that is the normal failure on
 * a phone with one bar, where the request neither succeeds nor errors. The
 * tester pressed Next, nothing happened, and pressing it again did nothing
 * either. The escape hatch was frozen by the same bug.
 *
 * Advancing matters more than the write. The write is retried by the next
 * saveProgress call, and the answers are held in component state either way.
 */
export const DEFAULT_WRITE_TIMEOUT_MS = 6000;

/** Resolves with the promise's value, or with `fallback` if it takes too long.
 *  Never rejects — a timeout is not an error the caller has to handle. */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number = DEFAULT_WRITE_TIMEOUT_MS,
    label = 'write',
): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            console.warn(`[withTimeout] ${label} did not settle in ${ms}ms — continuing without it.`);
            resolve(undefined);
        }, ms);

        promise
            .then((value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(value);
            })
            .catch((err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                console.error(`[withTimeout] ${label} failed:`, err);
                resolve(undefined);
            });
    });
}
