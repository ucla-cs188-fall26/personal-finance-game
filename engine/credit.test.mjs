import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from './state.mjs';
import { creditFactors, targetScore, updateScore, band } from './credit.mjs';

test('score requires six completed statement cycles', () => {
  for (let months = 0; months < 6; months++) {
    const s = newGame(); s.card.monthsOpen = months;
    assert.equal(updateScore(s).state.credit.score, null);
  }
  const s = newGame(); s.card.monthsOpen = 6;
  assert.equal(updateScore(s).events[0].type, 'score_first');
  assert.equal(targetScore(s), 740);
});

test('score inputs distinguish utilization and late history without claiming a real FICO score', () => {
  const s = newGame(); s.card.monthsOpen = 6;
  s.card.statementBalance = 100000;
  s.card.lateMarks = [{ month: 0, days: 30 }];
  // The specified formula yields 541, not an arbitrary forced score.
  assert.equal(targetScore(s), 541);
  assert.equal(band(541), 'Poor');
  assert.equal(band(null), 'No score yet');
  assert.ok(Object.values(creditFactors(s)).every(x => x >= 0 && x <= 1));
});

test('scores fall immediately and recover gradually without mutating previous history', () => {
  const s = newGame(); s.card.monthsOpen = 12; s.credit.score = 800;
  s.card.statementBalance = 100000;
  const snapshot = structuredClone(s);
  const fall = updateScore(s);
  assert.equal(fall.state.credit.score, targetScore(s));
  assert.deepEqual(s, snapshot);
  const recovered = { ...fall.state, card: { ...fall.state.card, statementBalance: 0 } };
  const rise = updateScore(recovered);
  assert.ok(rise.state.credit.score > fall.state.credit.score);
  assert.ok(rise.state.credit.score < targetScore(recovered));
  assert.ok(rise.events[0].reasons.includes('amounts'));
});

test('old marks and inquiries age out of model factors', () => {
  const s = newGame(); s.month = 84; s.card.monthsOpen = 84;
  s.card.lateMarks = [{ month: 0, days: 90 }];
  assert.equal(creditFactors(s).payment, 1);
  assert.equal(creditFactors(s).newCredit, 1);
  assert.equal(creditFactors(s).age, 1);
});
