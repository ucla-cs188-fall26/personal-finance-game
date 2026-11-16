import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, ageOf, dateOf, netWorth } from './state.mjs';
test('calendar crosses years independently from birthday and money uses cents', () => {
 const s = newGame(42);
 assert.deepEqual(dateOf(s), { year: 2026, monthIndex: 8 });
 assert.deepEqual(dateOf({ ...s, month: 4 }), { year: 2027, monthIndex: 0 });
 assert.equal(ageOf({ ...s, month: 11 }), 19);
 assert.equal(ageOf({ ...s, month: 12 }), 20);
 assert.equal(ageOf({ ...s, month: 72 }), 25);
 assert.equal(netWorth({ ...s, savings: 10000, card: { ...s.card, balance: 20000 }}), 62000);
});
