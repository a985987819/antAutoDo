'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Session, PACKAGE } = require('../src/core/session');
const { Runner } = require('../src/core/runner');
const { planTab } = require('../src/tasks/manor/lottery');
const { inspect } = require('../src/platform/diagnostics');
const screen = { packageName: PACKAGE, known: true, unlocked: true, foreground: true, blocked: false };
const action = { type: 'open', verified: true };

test('dry-run defaults on and limits actions', () => {
  const session = new Session({ maxActions: 1 });
  assert.equal(session.authorize(screen, action).dryRun, true);
  assert.throws(() => session.authorize(screen, action), /limit/);
});

test('unknown screen, background and blocked pages fail closed', () => {
  for (const change of [{ known: false }, { foreground: false }, { blocked: true }, { packageName: 'other' }, { unlocked: false }]) {
    assert.throws(() => new Session().authorize({ ...screen, ...change }, action), /Unsafe/);
  }
});

test('unknown and over-budget exchange cannot execute', () => {
  const session = new Session({ exchangeBudget: 10 });
  assert.throws(() => session.authorize(screen, { type: 'exchange', verified: true }), /budget/);
  session.authorize(screen, { type: 'exchange', verified: true, cost: 10 });
  assert.throws(() => session.authorize(screen, { type: 'exchange', verified: true, cost: 1 }), /budget/);
});

test('pause, stop and deadline reject actions', () => {
  const paused = new Session(); paused.pause();
  assert.throws(() => paused.authorize(screen, action), /runnable/);
  const stopped = new Session(); stopped.stop();
  assert.throws(() => stopped.authorize(screen, action), /runnable/);
  let now = 0;
  const timed = new Session({ clock: () => now, maxDurationMs: 10 });
  now = 10;
  assert.throws(() => timed.authorize(screen, action), /timed out/);
  assert.throws(() => new Session({ maxActions: NaN }), /Invalid/);
});

test('dry runner does not call action adapter', async () => {
  const runner = new Runner(new Session(), {
    observe: async () => screen,
    perform: async () => { throw new Error('must not execute'); }
  });
  assert.deepEqual(await runner.run([{ id: 'open', plan: () => action }]), [
    { id: 'open', status: 'planned', type: 'open' }
  ]);
});

test('live mode refuses unvalidated adapter', async () => {
  let called = false;
  const runner = new Runner(new Session({ dryRun: false }), {
    observe: async () => screen, perform: async () => { called = true; }
  });
  await assert.rejects(runner.run([{ id: 'open', plan: () => action }]), /not validated/);
  assert.equal(called, false);
  assert.equal(runner.session.state, 'stopped');
});

test('lottery checks each tab, exact count and native mode', () => {
  for (const id of ['daily', 'event']) {
    const tab = { id, verified: true, tasksComplete: true, chances: 6, nativeAutoDraw: true, autoDrawMode: 'all' };
    assert.equal(planTab(tab).status, 'ready');
    assert.equal(planTab({ ...tab, chances: 7 }).reason, 'would-overdraw');
    assert.equal(planTab({ ...tab, chances: 5 }).missing, 1);
    assert.equal(planTab({ ...tab, autoDrawMode: null }).reason, 'unknown-draw-mode');
    assert.equal(planTab({ ...tab, chances: 7, autoDrawMode: 'exact-six' }).expectedRemaining, 1);
  }
  assert.equal(planTab(null).status, 'needs-human');
});

test('diagnostic is read-only and never asserts device validation', () => {
  let calls = 0;
  const report = inspect({ captureScreen: () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(report.captureApiPresent, true);
  assert.equal(report.deviceValidated, false);
});
