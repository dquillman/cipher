/**
 * GA4 Funnel Events — Marketing Command Center
 *
 * North-star metrics:
 *   1. signup_complete  — ad platforms optimize toward this
 *   2. activated_user   — what matters for business success
 *
 * See /web/docs/event-definitions.md for the canonical written spec.
 * Uses gtag directly (loaded in index.html) for reliable GA4 delivery.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    lintrk?: (action: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * LinkedIn Campaign Manager conversion IDs. Set these from the LinkedIn
 * Conversions UI once paid LinkedIn campaigns are live. Leave null to skip
 * — lintrk page-view tracking still works via the Insight Tag in index.html.
 */
const LINKEDIN_CONVERSION_IDS = {
  signup_complete: null as number | null,
  activated_user:  null as number | null,
} as const;

function trackLinkedInConversion(event: keyof typeof LINKEDIN_CONVERSION_IDS) {
  const id = LINKEDIN_CONVERSION_IDS[event];
  if (id == null || !window.lintrk) return;
  window.lintrk('track', { conversion_id: id });
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** BroadcastChannel for cross-tab event verification (same origin). */
const verifyChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('ec_event_verify')
  : null;

function sendEvent(eventName: string, params?: Record<string, unknown>) {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
  // Broadcast to verifier tab
  verifyChannel?.postMessage({ type: 'ga4', name: eventName, params: params || {} });
}

/** Broadcast Meta Pixel events to verifier tab. */
function broadcastMeta(name: string, params: Record<string, unknown>) {
  verifyChannel?.postMessage({ type: 'meta', name, params });
}

/** Broadcast Google Ads events to verifier tab. */
function broadcastAds(name: string, params: Record<string, unknown>) {
  verifyChannel?.postMessage({ type: 'ads', name, params });
}

/** Read UTM params captured at session start (see captureUtmParams). */
function getStoredUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem('ec_utm') || '{}');
  } catch { return {}; }
}

/**
 * Call once on app load (Landing / Login) to snapshot UTM params for the session.
 * Later events pull from sessionStorage so the values survive in-app navigation.
 */
export function captureUtmParams() {
  if (sessionStorage.getItem('ec_utm')) return; // already captured this session
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  if (Object.keys(utm).length) {
    sessionStorage.setItem('ec_utm', JSON.stringify(utm));
  }
}

/* ── funnel events ───────────────────────────────────────────────────────── */

export function trackLandingPageView() {
  sendEvent('landing_page_view');
}

export function trackPricingView() {
  sendEvent('pricing_view');
}

export function trackCtaClick(location: string) {
  sendEvent('cta_click', { location });
}

export function trackTrialStart() {
  sendEvent('trial_start');
}

/**
 * NORTH-STAR #1 — signup_complete
 * Trigger: Firestore user doc created (setDoc resolves) for a NEW user.
 * Fires once per user (guarded by !userDoc.exists() in Login.tsx).
 */
export function trackSignupComplete(method: 'google' | 'email', userId: string) {
  const utm = getStoredUtm();
  sendEvent('signup_complete', { method, user_id: userId, ...utm });
  // Google Ads conversion tracking
  sendEvent('conversion', { send_to: 'AW-926344271/i6QQCPSdrIocEM_I27kD' });
  broadcastAds('conversion', { send_to: 'AW-926344271/i6QQCPSdrIocEM_I27kD' });
  // Meta Pixel conversion tracking
  if (window.fbq) window.fbq('track', 'CompleteRegistration', { method });
  broadcastMeta('CompleteRegistration', { method });
  // LinkedIn Campaign Manager conversion (no-op until ID set in LINKEDIN_CONVERSION_IDS)
  trackLinkedInConversion('signup_complete');
}

export function trackExamSelected(examId: string, examName: string) {
  sendEvent('exam_selected', { exam_id: examId, exam_name: examName });
}

/**
 * NORTH-STAR #2 — activated_user
 * Trigger: User answers their 10th question (currentQuestionIndex === 9).
 * Fires ONCE per user — deduplicated via localStorage flag.
 */
export function trackActivatedUser(examId: string, userId: string) {
  const DEDUP_KEY = `ec_activated_${userId}`;
  if (localStorage.getItem(DEDUP_KEY)) return; // already fired for this user
  localStorage.setItem(DEDUP_KEY, new Date().toISOString());

  const utm = getStoredUtm();
  sendEvent('activated_user', { exam_id: examId, user_id: userId, ...utm });
  // LinkedIn Campaign Manager conversion (no-op until ID set in LINKEDIN_CONVERSION_IDS)
  trackLinkedInConversion('activated_user');
}

export function trackExplanationViewed(questionId: string, examId: string) {
  sendEvent('explanation_viewed', { question_id: questionId, exam_id: examId });
}
