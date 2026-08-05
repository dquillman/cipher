const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getCheckoutUrls,
  getPublicOrigin,
  getSubscriptionPrices,
  parseBillingInterval,
} = require('../lib/billingConfig');

test('billing interval accepts only supported server-side plans', () => {
  assert.equal(parseBillingInterval('month'), 'month');
  // Pro is monthly-only since the live annual price was deleted 2026-08-04.
  // 'year' must be rejected, not silently resolved to a dead price id.
  assert.equal(parseBillingInterval('year'), null);
  assert.equal(parseBillingInterval('price_attacker'), null);
});

test('Stripe key mode selects matching default price mode', () => {
  const live = getSubscriptionPrices({ STRIPE_SECRET_KEY: 'sk_live_example' });
  const testPrices = getSubscriptionPrices({ STRIPE_SECRET_KEY: 'sk_test_example' });
  assert.match(live.month, /^price_1TH4B4/);
  assert.match(testPrices.month, /^price_1ScV4P/);
  assert.notEqual(live.month, testPrices.month);
});

test('configured prices override defaults and are validated', () => {
  assert.equal(getSubscriptionPrices({
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_PRICE_MONTHLY: 'price_customMonthly',
  }).month, 'price_customMonthly');
  assert.throws(() => getSubscriptionPrices({
    STRIPE_PRICE_MONTHLY: 'not-a-price',
  }), /invalid/);
});

test('no yearly price is exposed to checkout', () => {
  const prices = getSubscriptionPrices({ STRIPE_SECRET_KEY: 'sk_live_example' });
  assert.deepEqual(Object.keys(prices), ['month']);
  // The deleted live annual price must never reappear in the allow-list that
  // handleCheckoutSessionCompleted validates against.
  assert.ok(!Object.values(prices).includes('price_1TuEaQBH0CNhR0Vacg981ipq'));
});

test('checkout redirects are server-owned HTTPS URLs', () => {
  assert.equal(getPublicOrigin({ CIPHER_PUBLIC_ORIGIN: 'https://cipherexam.com/path' }), 'https://cipherexam.com');
  // Paths MUST stay under /app/* — they are React Router routes nested inside
  // <Route path="/app/*">. A bare /success or /pricing lands on the marketing
  // 404 / marketing pricing page instead of the post-checkout screen.
  assert.deepEqual(getCheckoutUrls({ CIPHER_PUBLIC_ORIGIN: 'https://cipherexam.com' }), {
    subscriptionSuccessUrl: 'https://cipherexam.com/app/success',
    subscriptionCancelUrl: 'https://cipherexam.com/app/pricing',
    passSuccessUrl: 'https://cipherexam.com/app/success?product=exam-pass',
    passCancelUrl: 'https://cipherexam.com/app/pricing',
    portalReturnUrl: 'https://cipherexam.com/app/pricing',
  });
  assert.throws(() => getPublicOrigin({ CIPHER_PUBLIC_ORIGIN: 'http://evil.example' }), /HTTPS/);
});
