import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, decide, eventFor, LIMIT, minimum, newRun } from './engine.mjs';

test('first statement charges interest on the unpaid amount only', () => {
  const purchase = decide(newRun(), 0);
  const full = decide(purchase, 0);
  const half = decide(purchase, 1);
  const min = decide(purchase, 2);
  assert.deepEqual([full.cash, full.balance, full.interest], [12000, 0, 0]);
  assert.deepEqual([half.cash, half.balance, half.interest], [42000, 30600, 600]);
  assert.deepEqual([min.cash, min.balance, min.interest], [68500, 57630, 1130]);
  assert.equal(minimum(1200), 1200);
});

test('family help increases checking and can fund a payment without erasing the bill', () => {
  const atCall = [0, 2, 1, 0, 2].reduce(decide, newRun());
  const accepted = decide(atCall, 0);
  assert.equal(accepted.cash - atCall.cash, 20000);
  assert.equal(accepted.aid, 20000);
  assert.equal(accepted.balance, atCall.balance);
  assert.equal(decide(accepted, 0).balance, 0);
});

test('every available path can finish without exceeding its cash or credit limit', () => {
  let finished = 0;
  function visit(run) {
    assert.ok(run.cash >= 0);
    assert.ok(run.balance >= 0 && run.balance <= LIMIT);
    const event = eventFor(run);
    if (!event) {
      assert.equal(run.history.length, chapters.length);
      finished++;
      return;
    }
    let enabled = 0;
    for (const [i, option] of event.options.entries()) {
      const next = decide(run, i);
      if (option.disabled) {
        assert.equal(next, run);
      } else {
        enabled++;
        assert.ok(next.interest >= run.interest);
        visit(next);
      }
    }
    assert.ok(enabled > 0, 'every event must offer at least one available choice');
  }
  visit(newRun());
  assert.ok(finished > 1);
});
