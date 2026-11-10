import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, eventFor, newRun } from './engine.mjs';
import { lessonFor } from './learning.mjs';
test('all reachable choices have a sourced lesson and valid practice answer', () => {
  function visit(run) {
    if (run.history.length) {
      const lesson = lessonFor(run);
      for (const key of ['skill', 'title', 'why', 'action', 'fact', 'question', 'explanation']) assert.ok(lesson[key]);
      assert.ok(lesson.answers[lesson.correct]);
      assert.match(lesson.source[1], /^https:\/\/www\.(consumerfinance|federalreserve)\.gov\//);
    }
    eventFor(run)?.options.forEach((option, i) => { if (!option.disabled) visit(decide(run, i)); });
  }
  visit(newRun());
});
