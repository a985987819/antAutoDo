'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { decide } = require('../src/tasks/manor/cyclic-feed');
const base = { pageVerified: true, obstructed: false, phase: 'game', elapsedMs: 30000, sinceLastPollMs: 30000, earnedGrams: 0, timerState: 'running' };
test('waits thirty seconds then observes subsequent rounds', () => {
  assert.equal(decide({ ...base, sinceLastPollMs: 10000 }).remainingMs, 20000);
  for (const timerState of ['running', 'new-round']) assert.equal(decide({ ...base, timerState }).next, 'observe-next-window');
});
test('only a verified stop returns; static or missing frames pause', () => {
  assert.equal(decide({ ...base, timerState: 'stopped', stopVerified: true }).next, 'return-once-and-inspect-reward');
  for (const timerState of ['stopped', 'static', 'missing', 'unknown']) assert.equal(decide({ ...base, timerState }).next, 'pause');
});
test('verified cumulative reward cap exits without assuming reward from time', () => {
  assert.equal(decide({ ...base, earnedGrams: 240 }).next, 'return-once-and-inspect-reward');
  assert.equal(decide({ ...base, earnedGrams: 30 }).next, 'observe-next-window');
  assert.equal(decide({ ...base, earnedGrams: 270 }).next, 'pause');
});
test('claim requires task page and verified visible reward; claimed is done', () => {
  const row = { ...base, phase: 'task-list', rewardState: 'claimable', rewardRowVerified: true, rewardVisible: true };
  assert.equal(decide(row).next, 'claim-once-and-verify');
  assert.equal(decide({ ...row, rewardVisible: false }).next, 'pause');
  assert.equal(decide({ ...row, rewardState: 'claimed' }).next, 'done');
});
test('obstruction, unknown pages and overall timeout stop the flow', () => {
  assert.equal(decide({ ...base, obstructed: true }).next, 'pause');
  assert.equal(decide({ ...base, pageVerified: false }).next, 'pause');
  assert.equal(decide({ ...base, elapsedMs: 600000 }).reason, 'session-timeout');
});
