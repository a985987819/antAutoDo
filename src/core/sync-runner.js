'use strict';

// Device I/O must be synchronous, bounded and cancellable; never pass async adapters.
function value(result) {
  if (result && typeof result.then === 'function') throw new Error('Asynchronous adapter not supported');
  return result;
}

function SyncRunner(session, adapter) {
  this.session = session;
  this.adapter = adapter;
  this.busy = false;
}

SyncRunner.prototype.run = function (steps) {
  if (this.busy) throw new Error('Runner already active');
  this.busy = true;
  var results = [];
  try {
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      var observation = value(this.adapter.observe(this.session));
      this.session.check(observation);
      var action = value(step.plan(observation));
      if (!action) {
        results.push({ id: step.id, status: 'skipped' });
        continue;
      }
      var permit = this.session.authorize(observation, action);
      if (permit.dryRun) {
        results.push({ id: step.id, status: 'planned', type: action.type });
        continue;
      }
      if (this.adapter.liveValidated !== true) throw new Error('Adapter not validated on device');
      value(this.adapter.perform(action, this.session));
      var after = value(this.adapter.observe(this.session));
      this.session.check(after);
      if (value(step.complete(after)) !== true) throw new Error('Postcondition not met');
      results.push({ id: step.id, status: 'completed' });
    }
    if (this.session.state === 'ready' || this.session.state === 'running') this.session.state = 'done';
    return results;
  } catch (error) {
    this.session.stop();
    throw error;
  } finally {
    this.busy = false;
  }
};

module.exports = { SyncRunner: SyncRunner };
