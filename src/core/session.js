'use strict';

var isSafeInteger = require('./numbers').isSafeInteger;
var PACKAGE = 'com.eg.android.AlipayGphone';
var ACTIONS = ['open', 'browse', 'collect', 'sign', 'exchange', 'draw'];

function Session(options) {
  options = options || {};
  this.dryRun = options.dryRun !== false;
  this.clock = options.clock || Date.now;
  this.maxActions = options.maxActions === undefined ? 200 : options.maxActions;
  this.maxDurationMs = options.maxDurationMs === undefined ? 900000 : options.maxDurationMs;
  this.exchangeBudget = options.exchangeBudget === undefined ? 0 : options.exchangeBudget;
  [this.maxActions, this.maxDurationMs, this.exchangeBudget].forEach(function (n) {
    if (!isSafeInteger(n) || n < 0) throw new Error('Invalid session budget');
  });
  this.startedAt = this.clock();
  if (!isSafeInteger(this.startedAt) || this.startedAt < 0) throw new Error('Invalid session clock');
  this.lastObservedAt = this.startedAt;
  this.actions = 0;
  this.spent = 0;
  this.state = 'ready';
}

Session.prototype.pause = function () {
  if (this.state === 'ready' || this.state === 'running') this.state = 'paused';
};

Session.prototype.stop = function () { this.state = 'stopped'; };

// Read-only checks remain available after the final permitted action.
Session.prototype.check = function (observation) {
  if (this.state !== 'ready' && this.state !== 'running') throw new Error('Session not runnable');
  var now = this.clock();
  if (!isSafeInteger(now) || now < this.lastObservedAt) throw new Error('Invalid session clock');
  this.lastObservedAt = now;
  if (now - this.startedAt >= this.maxDurationMs) throw new Error('Session timed out');
  if (!observation || observation.packageName !== PACKAGE || observation.known !== true ||
      observation.unlocked !== true || observation.foreground !== true || observation.blocked !== false) {
    throw new Error('Unsafe or unknown screen');
  }
};

Session.prototype.authorize = function (observation, action) {
  this.check(observation);
  if (this.actions >= this.maxActions) throw new Error('Action limit reached');
  if (!action || ACTIONS.indexOf(action.type) < 0 || action.verified !== true) {
    throw new Error('Unverified action');
  }
  var cost = action.type === 'exchange' ? action.cost : 0;
  if (!isSafeInteger(cost) || cost < 0 || this.spent + cost > this.exchangeBudget) {
    throw new Error('Exchange budget exceeded or unknown');
  }
  this.actions += 1;
  this.spent += cost;
  this.state = 'running';
  return { dryRun: this.dryRun, type: action.type };
};

module.exports = { Session: Session, PACKAGE: PACKAGE };
