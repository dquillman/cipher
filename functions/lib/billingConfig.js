"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckoutUrls = exports.getPublicOrigin = exports.getSubscriptionPrices = exports.parseBillingInterval = void 0;
const DEFAULT_TEST_PRICES = {
    month: 'price_1ScV4PPISVVFkTmYtxipM6eN',
};
const DEFAULT_LIVE_PRICES = {
    month: 'price_1TH4B4BH0CNhR0VajnZ1kBMi',
};
function parseBillingInterval(value) {
    return value === 'month' ? value : null;
}
exports.parseBillingInterval = parseBillingInterval;
function getSubscriptionPrices(env = process.env) {
    var _a;
    const isLive = ((_a = env.STRIPE_SECRET_KEY) === null || _a === void 0 ? void 0 : _a.startsWith('sk_live_')) === true;
    const defaults = isLive ? DEFAULT_LIVE_PRICES : DEFAULT_TEST_PRICES;
    const prices = {
        month: env.STRIPE_PRICE_MONTHLY || defaults.month,
    };
    for (const price of Object.values(prices)) {
        if (!/^price_[A-Za-z0-9]+$/.test(price)) {
            throw new Error('Stripe subscription price configuration is invalid.');
        }
    }
    return prices;
}
exports.getSubscriptionPrices = getSubscriptionPrices;
function getPublicOrigin(env = process.env) {
    const configured = env.CIPHER_PUBLIC_ORIGIN || 'https://cipherexam.com';
    const url = new URL(configured);
    const emulator = env.FUNCTIONS_EMULATOR === 'true';
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(emulator && local && url.protocol === 'http:')) {
        throw new Error('CIPHER_PUBLIC_ORIGIN must be HTTPS outside the emulator.');
    }
    return url.origin;
}
exports.getPublicOrigin = getPublicOrigin;
// These must match the ROUTER paths in web/src/App.tsx, not the marketing site.
// Success and the in-app pricing page are nested under <Route path="/app/*">,
// so they live at /app/success and /app/pricing — a bare /success 404s.
// Everyone hitting these is authenticated (checkout requires auth), so
// RequireAuth on /app/* is satisfied.
function getCheckoutUrls(env = process.env) {
    const origin = getPublicOrigin(env);
    return {
        subscriptionSuccessUrl: `${origin}/app/success`,
        subscriptionCancelUrl: `${origin}/app/pricing`,
        passSuccessUrl: `${origin}/app/success?product=exam-pass`,
        passCancelUrl: `${origin}/app/pricing`,
        portalReturnUrl: `${origin}/app/pricing`,
    };
}
exports.getCheckoutUrls = getCheckoutUrls;
//# sourceMappingURL=billingConfig.js.map