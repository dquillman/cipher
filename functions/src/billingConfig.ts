export type BillingInterval = 'month' | 'year';

type BillingEnvironment = Record<string, string | undefined>;

const DEFAULT_TEST_PRICES: Record<BillingInterval, string> = {
  month: 'price_1ScV4PPISVVFkTmYtxipM6eN',
  year: 'price_1ScXMIPISVVFkTmY9U5uaLTk',
};

const DEFAULT_LIVE_PRICES: Record<BillingInterval, string> = {
  month: 'price_1TH4B4BH0CNhR0VajnZ1kBMi',
  year: 'price_1TuEaQBH0CNhR0Vacg981ipq',
};

export function parseBillingInterval(value: unknown): BillingInterval | null {
  return value === 'month' || value === 'year' ? value : null;
}

export function getSubscriptionPrices(
  env: BillingEnvironment = process.env,
): Record<BillingInterval, string> {
  const isLive = env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true;
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

export function getCheckoutUrls(env: BillingEnvironment = process.env) {
  const origin = getPublicOrigin(env);
  return {
    subscriptionSuccessUrl: `${origin}/success`,
    subscriptionCancelUrl: `${origin}/pricing`,
    passSuccessUrl: `${origin}/success?product=exam-pass`,
    passCancelUrl: `${origin}/pricing`,
    portalReturnUrl: `${origin}/pricing`,
  };
}
