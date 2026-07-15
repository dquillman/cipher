import { lazy as reactLazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'ec_chunk_reload_at';
// If we already reloaded within this window and STILL can't load the chunk,
// stop reloading and let the error surface — the failure is real (offline, a
// genuine 404), not a stale deploy.
const RELOAD_COOLDOWN_MS = 20_000;

function isChunkLoadError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module|dynamically imported module/i.test(msg);
}

/**
 * React.lazy wrapper that survives stale chunks after a deploy. When we ship a
 * new build, Vite regenerates content-hashed chunk names; a browser still
 * running the old app requests a hash that no longer exists, the SPA rewrite
 * serves index.html (HTML, not JS), and the dynamic import throws. Here we do a
 * single hard reload to pull the fresh index.html + correct chunk names instead
 * of dead-ending in the error boundary. A short sessionStorage cooldown guards
 * against an infinite reload loop when the failure is genuine.
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
    factory: () => Promise<{ default: T }>,
) {
    return reactLazy(async () => {
        try {
            const mod = await factory();
            sessionStorage.removeItem(RELOAD_FLAG);
            return mod;
        } catch (err) {
            if (isChunkLoadError(err)) {
                const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
                const now = Date.now();
                if (!last || now - last > RELOAD_COOLDOWN_MS) {
                    sessionStorage.setItem(RELOAD_FLAG, String(now));
                    window.location.reload();
                    // Never resolve — nothing should render before the reload.
                    return new Promise<{ default: T }>(() => {});
                }
            }
            throw err;
        }
    });
}

/** True when an error is (very likely) a stale-deploy chunk-load failure. */
export function isDeployChunkError(err: unknown): boolean {
    return isChunkLoadError(err);
}
