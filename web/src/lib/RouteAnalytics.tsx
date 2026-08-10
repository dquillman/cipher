import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { captureUtmParams, trackLandingPageView, trackPageView } from './ga4';

/**
 * Fires a GA4 page_view on every SPA route change.
 *
 * Before this existed the app sent exactly one page_view per hard document
 * load, from gtag('config') in index.html. Every client-side navigation was
 * invisible, so the entire authenticated product collapsed into whichever page
 * the visitor first landed on — and GA4's engagement time went with it, since
 * it rides on events sent after a page_view. /lp/security-plus recorded
 * literally zero engaged seconds for that reason.
 *
 * DO NOT enable GA4 Enhanced Measurement on stream 13918118804 while this
 * component exists. Its "Page changes based on browser history events" option
 * fires its own page_view on every History API call, which would double-count
 * every navigation this component already reports. The two are alternatives,
 * not complements — verified OFF on 2026-08-09, which is why SPA navigations
 * were invisible in the first place. Turning it on is the one-toggle version of
 * this fix; if you ever prefer that route, delete this component in the same
 * change. Never run both.
 *
 * MUST stay mounted ABOVE VersionGate, AuthProvider and Suspense in App.tsx.
 * Those gates block rendering on two sequential network round-trips, and
 * anything downstream of them only reaches GA4 for visitors who wait — which is
 * why landing_page_view under-counted page_view roughly 3x.
 */

/** '/lp/pmp' and '/lp/pmp/' must never be two different rows. Root stays '/'. */
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function isLandingPath(path: string): boolean {
  return path === '/' || path.startsWith('/lp/');
}

export default function RouteAnalytics() {
  const { pathname, search } = useLocation();

  // Seeded with the entry pathname so the first effect run is a no-op: gtag
  // already sent that page_view from <head>. Re-sending it here would double
  // every entry. Same guard as Plausible's tracker (autocapture.js).
  const lastPath = useRef(normalizePath(window.location.pathname));
  const didInit = useRef(false);

  useEffect(() => {
    // StrictMode double-mounts effects in development; UTM capture is
    // idempotent but landing_page_view is not.
    if (didInit.current) return;
    didInit.current = true;

    captureUtmParams();
    if (isLandingPath(lastPath.current)) trackLandingPageView(lastPath.current);
  }, []);

  useEffect(() => {
    const path = normalizePath(pathname);
    if (lastPath.current === path) return;
    lastPath.current = path;

    trackPageView(path + search);
    if (isLandingPath(path)) trackLandingPageView(path);
  }, [pathname, search]);

  return null;
}
