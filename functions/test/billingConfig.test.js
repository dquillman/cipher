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
  assert.equal(parseBillingInterval('year'), 'year');
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
    STRIPE_PRICE_YEARLY: 'price_customYearly',
  }).year, 'price_customYearly');
  assert.throws(() => getSubscriptionPrices({
    STRIPE_PRICE_MONTHLY: 'not-a-price',
  }), /invalid/);
});

test('checkout redirects are server-owned HTTPS URLs', () => {
  assert.equal(getPublicOrigin({ CIPHER_PUBLIC_ORIGIN: 'https://cipherexam.com/path' }), 'https://cipherexam.com');
  assert.deepEqual(getCheckoutUrls({ CIPHER_PUBLIC_ORIGIN: 'https://cipherexam.com' }), {
    subscriptionSuccessUrl: 'https://cipherexam.com/success',
    subscriptionCancelUrl: 'https://cipherexam.com/pricing',
    passSuccessUrl: 'https://cipherexam.com/success?product=exam-pass',
    passCancelUrl: 'https://cipherexam.com/pricing',
    portalReturnUrl: 'https://cipherexam.com/pricing',
  });
  assert.throws(() => getPublicOrigin({ CIPHER_PUBLIC_ORIGIN: 'http://evil.example' }), /HTTPS/);
});
