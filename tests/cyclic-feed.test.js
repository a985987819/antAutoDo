'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { decide } = require('../src/tasks/manor/cyclic-feed');
const base = { pageVerified: true, obstructed: false, phase: 'game', elapsedMs: 30000 };
test('waits only until fifty seconds from game entry', () => {
  assert.equal(decide(base).remainingMs, 20000);
  assert.equal(decide({ ...base, elapsedMs: 49999 }).remainingMs, 1);
});
test('fifty seconds closes regardless of ring still running', () => {
  for (const elapsedMs of [50000, 600000]) {
    assert.equal(decide({ ...base, elapsedMs, timerState: 'running' }).next, 'close-game-and-inspect-reward');
  }
});
test('does not assume reward quantity from elapsed time', () => {
  assert.equal(decide({ ...base, earnedGrams: 240 }).next, 'wait');
});
test('claim requires verified visible row; already claimed is done', () => {
  const row = { ...base, phase: 'task-list', rewardState: 'claimable', rewardRowVerified: true, rewardVisible: true };
  assert.equal(decide(row).next, 'claim-once-and-verify');
  assert.equal(decide({ ...row, rewardVisible: false }).next, 'pause');
  assert.equal(decide({ ...row, rewardState: 'claimed' }).next, 'done');
});
test('capacity warning is dismissed without confirming partial reward', () => {
  assert.equal(decide({ ...base, phase: 'capacity-warning', obstructed: true }).next, 'dismiss-warning-and-stop');
  assert.equal(decide({ ...base, phase: 'capacity-warning', pageVerified: false }).next, 'pause');
});
test('unknown or obstructed pages and invalid times pause', () => {
  assert.equal(decide({ ...base, obstructed: true }).next, 'pause');
  assert.equal(decide({ ...base, pageVerified: false }).next, 'pause');
  assert.equal(decide({ ...base, elapsedMs: NaN }).next, 'pause');
});
