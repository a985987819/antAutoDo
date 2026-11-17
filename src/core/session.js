'use strict';

const PACKAGE = 'com.eg.android.AlipayGphone';
const ACTIONS = ['open', 'browse', 'collect', 'sign', 'exchange', 'draw'];

class Session {
  constructor(options) {
    options = options || {};
    this.dryRun = options.dryRun !== false;
    this.clock = options.clock || Date.now;
    this.maxActions = options.maxActions === undefined ? 200 : options.maxActions;
    this.maxDurationMs = options.maxDurationMs === undefined ? 900000 : options.maxDurationMs;
    this.exchangeBudget = options.exchangeBudget === undefined ? 0 : options.exchangeBudget;
    [this.maxActions, this.maxDurationMs, this.exchangeBudget].forEach(function (n) {
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid session budget');
    });
    this.startedAt = this.clock();
    this.actions = 0;
    this.spent = 0;
    this.state = 'ready';
  }

  pause() {
    if (this.state === 'ready' || this.state === 'running') this.state = 'paused';
  }

  stop() { this.state = 'stopped'; }

  authorize(observation, action) {
    if (this.state !== 'ready' && this.state !== 'running') throw new Error('Session not runnable');
    if (this.clock() - this.startedAt >= this.maxDurationMs) throw new Error('Session timed out');
    if (this.actions >= this.maxActions) throw new Error('Action limit reached');
    if (!observation || observation.packageName !== PACKAGE || observation.known !== true ||
        observation.unlocked !== true || observation.foreground !== true || observation.blocked !== false) {
      throw new Error('Unsafe or unknown screen');
    }
    if (!action || ACTIONS.indexOf(action.type) < 0 || action.verified !== true) {
      throw new Error('Unverified action');
    }
    const cost = action.type === 'exchange' ? action.cost : 0;
    if (!Number.isSafeInteger(cost) || cost < 0 || this.spent + cost > this.exchangeBudget) {
      throw new Error('Exchange budget exceeded or unknown');
    }
    this.actions += 1;
    this.spent += cost;
    this.state = 'running';
    return { dryRun: this.dryRun, type: action.type };
  }
}

module.exports = { Session: Session, PACKAGE: PACKAGE };
