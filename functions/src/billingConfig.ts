// Pro is a MONTHLY-ONLY subscription. The annual price ($190/yr,
// price_1TuEaQBH0CNhR0Vacg981ipq) was deleted in the live dashboard on
// 2026-08-04 — do not re-add it here without creating a real recurring price
// first, or checkout dies with "No such price".
//
// The second SKU is NOT a subscription: it is the one-time, non-renewing $59
// 90-day Exam Pass in examPass.ts, which uses inline price_data and never
// references a Price object. Nothing below applies to it.
export type BillingInterval = 'month';

type BillingEnvironment = Record<string, string | undefined>;

const DEFAULT_TEST_PRICES: Record<BillingInterval, string> = {
  month: 'price_1ScV4PPISVVFkTmYtxipM6eN',
};

const DEFAULT_LIVE_PRICES: Record<BillingInterval, string> = {
  month: 'price_1TH4B4BH0CNhR0VajnZ1kBMi',
};

export function parseBillingInterval(value: unknown): BillingInterval | null {
  return value === 'month' ? value : null;
}

export function getSubscriptionPrices(
  env: BillingEnvironment = process.env,
): Record<BillingInterval, string> {
  const isLive = env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true;
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

export function getPublicOrigin(env: BillingEnvironment = process.env): string {
  const configured = env.CIPHER_PUBLIC_ORIGIN || 'https://cipherexam.com';
  const url = new URL(configured);
  const emulator = env.FUNCTIONS_EMULATOR === 'true';
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(emulator && local && url.protocol === 'http:')) {
    throw new Error('CIPHER_PUBLIC_ORIGIN must be HTTPS outside the emulator.');
  }
  return url.origin;
}

// These must match the ROUTER paths in web/src/App.tsx, not the marketing site.
// Success and the in-app pricing page are nested under <Route path="/app/*">,
// so they live at /app/success and /app/pricing — a bare /success 404s.
// Everyone hitting these is authenticated (checkout requires auth), so
// RequireAuth on /app/* is satisfied.
export function getCheckoutUrls(env: BillingEnvironment = process.env) {
  const origin = getPublicOrigin(env);
  return {
    subscriptionSuccessUrl: `${origin}/app/success`,
    subscriptionCancelUrl: `${origin}/app/pricing`,
    passSuccessUrl: `${origin}/app/success?product=exam-pass`,
    passCancelUrl: `${origin}/app/pricing`,
    portalReturnUrl: `${origin}/app/pricing`,
  };
}
