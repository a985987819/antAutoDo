'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Session, PACKAGE } = require('../src/core/session');
const { Runner } = require('../src/core/runner');
const screen = { packageName: PACKAGE, known: true, foreground: true, unlocked: true, blocked: false };
const step = { id: 'open', plan: () => ({ type: 'open', verified: true }), complete: () => true };

test('one runner rejects concurrent execution', async () => {
  let release;
  const runner = new Runner(new Session(), {
    observe: () => new Promise(resolve => { release = resolve; })
  });
  const pending = runner.run([step]);
  await assert.rejects(runner.run([step]), /already active/);
  release(screen);
  await pending;
  assert.equal(runner.busy, false);
});

test('failed postcondition stops subsequent actions', async () => {
  let count = 0;
  const runner = new Runner(new Session({ dryRun: false }), {
    liveValidated: true,
    observe: async () => screen,
    perform: async () => { count++; }
  });
  await assert.rejects(runner.run([{ ...step, complete: () => false }, step]), /Postcondition/);
  assert.equal(count, 1);
  assert.equal(runner.session.state, 'stopped');
});

test('manual stop during observation prevents action', async () => {
  const session = new Session();
  const runner = new Runner(session, {
    observe: async () => { session.stop(); return screen; }
  });
  await assert.rejects(runner.run([step]), /not runnable/);
});

test('stopped session cannot run even skipped steps', async () => {
  const session = new Session();
  session.stop();
  const runner = new Runner(session, { observe: async () => screen });
  await assert.rejects(runner.run([{ id: 'skip', plan: () => null }]), /not runnable/);
});
