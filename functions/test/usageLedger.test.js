const test = require('node:test');
const assert = require('node:assert/strict');
const { countAnswered, answeredDelta, usageDayKey, usageCounterId } = require('../lib/usageLedger');

const run = (n) => ({
  answers: Array.from({ length: n }, (_, i) => ({ questionId: `q${i}`, selectedOption: 1, isCorrect: true })),
});

test('countAnswered ignores entries without a selectedOption', () => {
  assert.equal(countAnswered(undefined), 0);
  assert.equal(countAnswered(null), 0);
  assert.equal(countAnswered({}), 0);
  assert.equal(countAnswered({ answers: [] }), 0);
  assert.equal(countAnswered(run(3)), 3);
  assert.equal(countAnswered({ answers: [{ questionId: 'q0' }, { questionId: 'q1', selectedOption: 0 }] }), 1);
});

test('answering more questions adds exactly the new answers', () => {
  assert.equal(answeredDelta(undefined, run(1)), 1); // first answer on a new run
  assert.equal(answeredDelta(run(4), run(6)), 2);    // two more this write
});

test('re-answering the same question does not move the ledger', () => {
  const before = { answers: [{ questionId: 'q0', selectedOption: 0 }] };
  const after = { answers: [{ questionId: 'q0', selectedOption: 3 }] }; // changed choice, same question
  assert.equal(answeredDelta(before, after), 0);
});

test('the reset exploit cannot decrement the day: delete adds nothing', () => {
  // A user who answered 5, then deletes the run to reset their count.
  assert.equal(answeredDelta(run(5), undefined), 0);
});

test('completeRun filtering answers cannot decrement the day', () => {
  // completeRun may drop answers with undefined selectedOption; the tally must
  // not shrink as a result.
  assert.equal(answeredDelta(run(10), run(8)), 0);
});

test('Quit & Save still counts the answers given: an in-progress run is charged', () => {
  // The whole bug: the old code only counted completed runs, so answers in a
  // run left in_progress counted as zero. Here each saveProgress write adds its
  // one answer regardless of the run ever reaching completedAt.
  let ledger = 0;
  for (let i = 1; i <= 4; i++) {
    ledger += answeredDelta(run(i - 1), run(i)); // one answer appended per write
  }
  assert.equal(ledger, 4); // four answers given, four counted — even with no completion
});

test('the counter id and day key are UTC and stable', () => {
  const d = new Date('2026-08-11T23:59:59.000Z');
  assert.equal(usageDayKey(d), '2026-08-11');
  assert.equal(usageCounterId('abc123', '2026-08-11'), 'abc123_2026-08-11');
});
