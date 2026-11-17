'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Session, PACKAGE } = require('../src/core/session');
const { SyncRunner } = require('../src/core/sync-runner');
const { isSafeInteger, isFiniteNumber } = require('../src/core/numbers');
const screen = { packageName: PACKAGE, known: true, foreground: true, unlocked: true, blocked: false };
function step() {
  return { id: 'collect', plan: () => ({ type: 'collect', verified: true }), complete: after => after.collected === true };
}

test('portable numeric helpers reject coercion and unsafe integers', () => {
  for (const n of [NaN, Infinity, '1', null, 1.5, 9007199254740992]) assert.equal(isSafeInteger(n), false);
  assert.equal(isSafeInteger(9007199254740991), true);
  assert.equal(isFiniteNumber(1.5), true);
  assert.equal(isFiniteNumber('1'), false);
});

test('sync dry run does not perform actions', () => {
  const runner = new SyncRunner(new Session(), {
    observe: () => screen,
    perform: () => assert.fail('Dry run performed an action')
  });
  assert.deepEqual(runner.run([step()]), [{ id: 'collect', status: 'planned', type: 'collect' }]);
});

test('last permitted action is still observed and verified', () => {
  let collected = false;
  let observations = 0;
  const session = new Session({ dryRun: false, maxActions: 1 });
  const runner = new SyncRunner(session, {
    liveValidated: true,
    observe: () => { observations++; return { ...screen, collected }; },
    perform: () => { collected = true; }
  });
  assert.equal(runner.run([step()])[0].status, 'completed');
  assert.equal(observations, 2);
  assert.equal(session.actions, 1);
});

test('unvalidated adapter never performs an action', () => {
  const session = new Session({ dryRun: false });
  const runner = new SyncRunner(session, {
    observe: () => screen,
    perform: () => assert.fail('Unvalidated action')
  });
  assert.throws(() => runner.run([step()]), /not validated/);
  assert.equal(session.state, 'stopped');
});

test('unsafe post-action screen and false completion stop the session', () => {
  for (const after of [{ ...screen, blocked: true }, screen]) {
    let performed = false;
    const session = new Session({ dryRun: false });
    const runner = new SyncRunner(session, {
      liveValidated: true,
      observe: () => performed ? after : screen,
      perform: () => { performed = true; }
    });
    assert.throws(() => runner.run([step()]), /Unsafe|Postcondition/);
    assert.equal(session.state, 'stopped');
    assert.equal(runner.busy, false);
  }
});

test('async observation is rejected before action planning', () => {
  const runner = new SyncRunner(new Session(), { observe: () => ({ then: function () {} }) });
  assert.throws(() => runner.run([step()]), /Asynchronous/);
});

test('stop during action prevents completion and further actions', () => {
  const session = new Session({ dryRun: false });
  const runner = new SyncRunner(session, {
    liveValidated: true,
    observe: () => screen,
    perform: () => session.stop()
  });
  assert.throws(() => runner.run([step(), step()]), /not runnable/);
  assert.equal(session.actions, 1);
});

test('same runner cannot be reentered', () => {
  const session = new Session({ dryRun: false });
  const runner = new SyncRunner(session, {
    liveValidated: true,
    observe: () => screen,
    perform: () => assert.throws(() => runner.run([]), /already active/)
  });
  const complete = step();
  complete.complete = () => true;
  assert.equal(runner.run([complete])[0].status, 'completed');
});

test('invalid and backward clocks fail closed', () => {
  assert.throws(() => new Session({ clock: () => NaN }), /clock/);
  let now = 10;
  const session = new Session({ clock: () => now });
  session.check(screen);
  now = 9;
  assert.throws(() => session.check(screen), /clock/);
});

test('deadline remains active during read-only postcondition checks', () => {
  let now = 0;
  const session = new Session({ dryRun: false, clock: () => now, maxDurationMs: 10 });
  const runner = new SyncRunner(session, {
    liveValidated: true,
    observe: () => screen,
    perform: () => { now = 10; }
  });
  assert.throws(() => runner.run([step()]), /timed out/);
});
