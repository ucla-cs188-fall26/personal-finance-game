import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonFor } from './learning.mjs';
test('life events and credit consequences have sourced, answerable lessons', () => {
  for (const id of ['laptop','bike_repair','campus_job','call_home','grace_lost','grace_restored','late_fee','late_mark','penalty_apr_on','score_first','payment','unknown-event']) {
    const l = lessonFor(id);
    for (const key of ['skill','title','why','action','question','explanation']) assert.ok(l[key]);
    assert.ok(l.answers[l.correct]);
    assert.match(l.source[1], /^https:\/\/www\.(consumerfinance|federalreserve)\.gov\//);
  }
});
