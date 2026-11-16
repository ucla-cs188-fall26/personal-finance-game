import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from './state.mjs';
import { rng, pickWeighted } from './rng.mjs';
import { eventDeck, buildEvent, applyEventChoice } from './events.mjs';
test('seeded random sequences and weighted choices are reproducible', () => {
  const sequence = seed => { let s = newGame(seed); return Array.from({ length: 30 }, () => { const r = rng(s); s = r.state; return r.value; }); };
  assert.deepEqual(sequence(42), sequence(42));
  assert.notDeepEqual(sequence(42), sequence(43));
  assert.equal(pickWeighted(newGame(1), []).value, null);
});
test('event deck builds serializable choices and respects cash and credit across 200 states', () => {
  assert.ok(eventDeck.filter(e => e.scheduledMonth === undefined).length >= 8);
  for (let seed = 0; seed < 200; seed++) {
    const s = newGame(seed);
    s.month = seed % 72; s.cash = seed * 173; s.savings = seed * 23;
    s.card.balance = (seed * 579) % s.card.limit;
    s.flags.graduated = seed % 2 === 0;
    for (const event of eventDeck) {
      const prompt = buildEvent(s, event.id);
      assert.ok(prompt.title && prompt.options.length);
      assert.deepEqual(JSON.parse(JSON.stringify(prompt)), prompt);
      for (let i = 0; i < prompt.options.length; i++) {
        const before = structuredClone(s);
        const result = applyEventChoice(s, event.id, i);
        assert.deepEqual(s, before, 'choice must not mutate input');
        assert.ok(result.state.cash >= 0);
        assert.ok(result.state.card.balance <= result.state.card.limit);
        if (prompt.options[i].disabled) assert.deepEqual(result.state, s);
      }
    }
  }
});
