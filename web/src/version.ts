// 🔒 SINGLE SOURCE OF TRUTH FOR APP VERSION
// Update this file for every release before build + deploy

export const APP_VERSION = '1.22.5';

const isStaging = typeof window !== 'undefined' && window.location.hostname.includes('staging');

export const DISPLAY_VERSION = isStaging ? `${APP_VERSION} (staging)` : APP_VERSION;
