import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from './state.mjs';
import { charge, closeStatement, applyPayment, policyPayment } from './card.mjs';
import { updateScore } from './credit.mjs';
const funded = () => ({ ...newGame(42), cash: 10_000_000 });
const cycle = (s, policy = 'full') => {
  let next = closeStatement({ ...s, paymentPolicy: policy }).state;
  next = policyPayment(next).state;
  next = updateScore(next).state;
  return { ...next, month: next.month + 1 };
};

test('statement math matches hand-calculated examples in cents', () => {
  // balance | grace | prior fees | interest | resulting balance | minimum
  const examples = [
    [60000, true, 0, 0, 60000, 2500],
    [60000, false, 0, 1200, 61200, 2500],
    [100000, false, 0, 2000, 102000, 3000],
    [1000, false, 0, 20, 1020, 1020],
    [63000, false, 3000, 1260, 64260, 4860],
    [0, true, 0, 0, 0, 0],
  ];
  for (const [balance, graceActive, feesSinceStatement, interest, total, minimum] of examples) {
    const s = newGame(1);
    Object.assign(s.card, { balance, graceActive, feesSinceStatement });
    const snapshot = structuredClone(s);
    const result = closeStatement(s).state;
    assert.deepEqual(s, snapshot, 'does not mutate its input');
    assert.equal(result.card.interestPaid, interest);
    assert.equal(result.card.balance, total);
    assert.equal(result.card.minimumDue, minimum);
  }
});

test('all purchases enforce limit and reject invalid money', () => {
  const s = newGame(2);
  assert.equal(charge(s, 100001).events[0].type, 'declined');
  assert.equal(charge(s, 100001).state.card.balance, 0);
  assert.equal(charge(s, 100000).state.card.balance, 100000);
  assert.throws(() => charge(s, -1), RangeError);
  assert.throws(() => charge(s, NaN), RangeError);
});

test('full payments with stable monthly purchases incur no interest and improve score', () => {
  let s = funded(), previous = 0;
  for (let i = 0; i < 36; i++) {
    s = cycle(charge(s, 8000).state);
    assert.equal(s.card.balance, 0);
    assert.equal(s.card.interestPaid, 0);
    if (s.credit.score != null) { assert.ok(s.credit.score >= previous); previous = s.credit.score; }
  }
});

test('minimum payments eventually repay a $600 purchase with interest', () => {
  let s = charge(funded(), 60000).state;
  let cycles = 0;
  while (s.card.balance && cycles < 100) { s = cycle(s, 'minimum'); cycles++; }
  assert.ok(cycles >= 30 && cycles <= 36, `payoff took ${cycles} months`);
  assert.equal(s.card.balance, 0);
  assert.ok(s.card.interestPaid > 0);
});

test('missed payments create escalating fees and penalty APR, six on-time payments restore it', () => {
  let s = charge(funded(), 60000).state;
  s = cycle(s, 'none');
  assert.equal(s.card.feesPaid, 3000);
  s = cycle(s, 'none');
  assert.equal(s.card.feesPaid, 7100);
  assert.deepEqual(s.card.lateMarks.map(mark => mark.days), [30, 60]);
  assert.equal(s.card.penaltyActive, true);
  for (let i = 0; i < 6; i++) s = cycle(s, 'minimum');
  assert.equal(s.card.penaltyActive, false);
  assert.equal(s.card.daysPastDue, 0);
  assert.equal(s.card.onTimeStreak, 6);
});

test('repeat fee window expires; unaffordable policy payment spends only available cash', () => {
  let s = charge(funded(), 60000).state;
  s = cycle(s, 'none');
  s = cycle(s, 'full');
  s.month = 8;
  s = cycle(charge(s, 10000).state, 'none');
  assert.equal(s.card.feesPaid, 6000);
  const short = closeStatement({ ...charge(newGame(), 60000).state, cash: 1500 }).state;
  assert.equal(policyPayment(short).state.cash, 0);
  assert.throws(() => applyPayment(short, 1501), RangeError);
});

test('ongoing severe delinquency refreshes its mark without stacking or payment-factor recovery', async () => {
  const { creditFactors } = await import('./credit.mjs');
  let s = charge(funded(), 60000).state;
  for (let month = 0; month < 120; month++) {
    s = cycle(s, 'none');
    if (month >= 2) {
      assert.equal(creditFactors(s).payment, 0);
      assert.equal(s.card.lateMarks.filter(mark => mark.days === 90).length, 1);
      assert.equal(s.card.lateMarks.at(-1).month, month);
    }
  }
  const latestMarkMonth = s.card.lateMarks.at(-1).month;
  s.cash = s.card.balance;
  s = cycle(s, 'full');
  assert.equal(s.card.daysPastDue, 0);
  assert.equal(s.card.lateMarks.at(-1).month, latestMarkMonth);
  assert.ok(creditFactors(s).payment > 0, 'historical recovery is allowed after curing delinquency');
});
