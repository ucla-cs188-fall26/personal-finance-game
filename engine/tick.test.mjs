import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from './state.mjs';
import { advanceMonth, advanceYear, resolveChoice } from './tick.mjs';
function play(seed, policy, callback = () => {}) {
  let s = { ...newGame(seed), paymentPolicy: policy };
  let clicks = 0;
  while (s.phase !== 'ended' && clicks++ < 300) {
    const before = structuredClone(s);
    let result;
    if (s.pending) {
      const index = s.pending.kind === 'payment' ? s.pending.options.findIndex(o => o.id === (policy === 'fixed' ? 'custom' : policy) && !o.disabled) : s.pending.options.findIndex(o => !o.disabled);
      result = resolveChoice(s, index >= 0 ? index : s.pending.options.findIndex(o => o.id === 'none'), s.pending.kind === 'payment' ? Math.min(s.fixedPayment, s.cash, s.card.balance) : undefined);
    } else result = s.phase === 'monthly' ? advanceMonth(s) : advanceYear(s);
    assert.deepEqual(s, before, 'engine must not mutate input');
    s = result.state;
    callback(s, result.events);
    assert.ok(s.cash >= 0);
    assert.ok(Number.isSafeInteger(s.card.balance));
  }
  assert.equal(s.month, 72);
  assert.equal(s.phase, 'ended');
  return s;
}
test('all four standing policies can finish reproducible full lives', () => {
  for (const policy of ['full', 'minimum', 'fixed', 'none']) {
    for (const seed of [1, 42, 93]) {
      const first = play(seed, policy);
      assert.deepEqual(first, play(seed, policy));
      assert.equal(first.log.filter(e => e.type === 'year_summary').length, 5);
      assert.equal(first.card.monthsOpen, 72);
      assert.equal(first.log.filter(e => e.type === 'payday').length, 72);
    }
  }
});
test('scheduled events have their assigned month and years pause at most twice', () => {
  const s = play(42, 'full');
  for (const [id, month] of [['laptop', 0], ['bike_repair', 2], ['campus_job', 3], ['call_home', 5]]) {
    const entries = s.log.filter(e => e.type === 'choice_made' && e.eventId === id);
    assert.equal(entries.length, 1); assert.equal(entries[0].month, month);
  }
  for (let year = 1; year < 6; year++) {
    const count = s.log.filter(e => e.type === 'choice_made' && e.eventId !== 'payment' && e.month >= year * 12 && e.month < (year + 1) * 12).length;
    assert.ok(count <= 2);
  }
});
test('pending actions are stable across reload, invalid choices cannot advance', () => {
  const s = advanceMonth(newGame(2)).state;
  assert.equal(s.pending.eventId, 'laptop');
  assert.deepEqual(advanceMonth(s).state, s);
  assert.deepEqual(resolveChoice(s, -1).state, s);
  const clone = JSON.parse(JSON.stringify(s));
  assert.deepEqual(resolveChoice(s, 0), resolveChoice(clone, 0));
});
test('cash shortages remain explicit bill arrears rather than disappearing', () => {
  const s = newGame(2); s.cash = 0; s.income.monthly = 0;
  const next = advanceMonth(s);
  assert.equal(next.state.cash, 0);
  assert.equal(next.state.billsArrears, 75000);
  assert.ok(next.events.some(e => e.type === 'bills_shortfall'));
});
