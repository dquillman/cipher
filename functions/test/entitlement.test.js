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

test('an unexpired exam pass grants server-side access', () => {
  // examPass.ts writes only `entitlement` on fulfilment. Nothing on the server
  // read it, so a $59 pass buyer was treated as free tier by validateQuizStart
  // and requirePro — capped, and told to upgrade, after paying.
  const record = {
    entitlement: {
      type: 'exam-pass',
      examId: 'pmp-2026',
      expiresAt: timestamp(new Date('2026-10-01T12:00:00.000Z')),
    },
  };
  assert.equal(resolveProAccess(record, now), 'exam-pass');
  assert.equal(hasProAccess(record, now), true);
});

test('expired or malformed exam passes grant nothing', () => {
  const expired = {
    entitlement: {
      type: 'exam-pass',
      examId: 'pmp-2026',
      expiresAt: timestamp(new Date('2026-07-19T12:00:00.000Z')),
    },
  };
  assert.equal(resolveProAccess(expired, now), null);

  for (const entitlement of [
    null,
    'exam-pass',
    { type: 'exam-pass' },                                  // no expiry at all
    { type: 'exam-pass', expiresAt: null },
    { type: 'subscription', expiresAt: timestamp(new Date('2026-10-01T12:00:00.000Z')) },
  ]) {
    assert.equal(resolveProAccess({ entitlement }, now), null,
      `entitlement ${JSON.stringify(entitlement)} must not grant access`);
  }
});

test('a paid subscription still outranks an exam pass in the reported reason', () => {
  // Ordering matters for callers that branch on the reason, e.g. startTrialCallable.
  assert.equal(resolveProAccess({
    isPro: true,
    subscriptionStatus: 'active',
    entitlement: {
      type: 'exam-pass',
      expiresAt: timestamp(new Date('2026-10-01T12:00:00.000Z')),
    },
  }, now), 'paid');
});

test('canceled or expired access is rejected', () => {
  assert.equal(resolveProAccess({ isPro: true, subscriptionStatus: 'canceled' }, now), null);
  assert.equal(resolveProAccess({ billingStatus: 'paid', subscriptionStatus: 'canceled' }, now), null);
  assert.equal(resolveProAccess({
    testerOverride: true,
    testerExpiresAt: timestamp(new Date('2026-07-19T12:00:00.000Z')),
  }, now), null);
});
