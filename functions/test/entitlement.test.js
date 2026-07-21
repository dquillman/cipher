const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveProAccess, hasProAccess } = require('../lib/entitlement');

const timestamp = (date) => ({ toDate: () => date });
const now = new Date('2026-07-20T12:00:00.000Z');

test('expired trial is not Pro even when legacy plan is pro', () => {
  const record = {
    plan: 'pro',
    trial: true,
    trialEndsAt: timestamp(new Date('2026-07-19T12:00:00.000Z')),
  };
  assert.equal(resolveProAccess(record, now), null);
  assert.equal(hasProAccess(record, now), false);
});

test('active trial requires a future server timestamp', () => {
  assert.equal(resolveProAccess({
    plan: 'trial',
    trial: true,
    trialEndsAt: timestamp(new Date('2026-07-21T12:00:00.000Z')),
  }, now), 'trial');
  assert.equal(resolveProAccess({ plan: 'trial', trial: true }, now), null);
});

test('paid, comped, and unexpired tester records receive Pro access', () => {
  assert.equal(resolveProAccess({ isPro: true, subscriptionStatus: 'active' }, now), 'paid');
  assert.equal(resolveProAccess({ billingStatus: 'comped' }, now), 'comped');
  assert.equal(resolveProAccess({
    testerOverride: true,
    testerExpiresAt: timestamp(new Date('2026-07-21T12:00:00.000Z')),
  }, now), 'tester');
});

test('canceled or expired access is rejected', () => {
  assert.equal(resolveProAccess({ isPro: true, subscriptionStatus: 'canceled' }, now), null);
  assert.equal(resolveProAccess({ billingStatus: 'paid', subscriptionStatus: 'canceled' }, now), null);
  assert.equal(resolveProAccess({
    testerOverride: true,
    testerExpiresAt: timestamp(new Date('2026-07-19T12:00:00.000Z')),
  }, now), null);
});
