"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckoutUrls = exports.getPublicOrigin = exports.getSubscriptionPrices = exports.parseBillingInterval = void 0;
const DEFAULT_TEST_PRICES = {
    month: 'price_1ScV4PPISVVFkTmYtxipM6eN',
    year: 'price_1ScXMIPISVVFkTmY9U5uaLTk',
};
const DEFAULT_LIVE_PRICES = {
    month: 'price_1TH4B4BH0CNhR0VajnZ1kBMi',
    year: 'price_1TuEaQBH0CNhR0Vacg981ipq',
};
function parseBillingInterval(value) {
    return value === 'month' || value === 'year' ? value : null;
}
exports.parseBillingInterval = parseBillingInterval;
function getSubscriptionPrices(env = process.env) {
    var _a;
    const isLive = ((_a = env.STRIPE_SECRET_KEY) === null || _a === void 0 ? void 0 : _a.startsWith('sk_live_')) === true;
    const defaults = isLive ? DEFAULT_LIVE_PRICES : DEFAULT_TEST_PRICES;
    const prices = {
        month: env.STRIPE_PRICE_MONTHLY || defaults.month,
        year: env.STRIPE_PRICE_YEARLY || defaults.year,
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
function getCheckoutUrls(env = process.env) {
    const origin = getPublicOrigin(env);
    return {
        subscriptionSuccessUrl: `${origin}/success`,
        subscriptionCancelUrl: `${origin}/pricing`,
        passSuccessUrl: `${origin}/success?product=exam-pass`,
        passCancelUrl: `${origin}/pricing`,
        portalReturnUrl: `${origin}/pricing`,
    };
}
exports.getCheckoutUrls = getCheckoutUrls;
//# sourceMappingURL=billingConfig.js.map