'use strict';

// One runner owns one session; the adapter must provide bounded, cancellable I/O.
class Runner {
  constructor(session, adapter) {
    this.session = session;
    this.adapter = adapter;
    this.busy = false;
  }

  async run(steps) {
    if (this.busy) throw new Error('Runner already active');
    this.busy = true;
    const results = [];
    try {
      for (const step of steps) {
        if (this.session.state !== 'ready' && this.session.state !== 'running') {
          throw new Error('Session not runnable');
        }
        const observation = await this.adapter.observe();
        const action = step.plan(observation);
        if (!action) {
          results.push({ id: step.id, status: 'skipped' });
          continue;
        }
        const permit = this.session.authorize(observation, action);
        if (permit.dryRun) {
          results.push({ id: step.id, status: 'planned', type: action.type });
          continue;
        }
        if (this.adapter.liveValidated !== true) throw new Error('Adapter not validated on device');
        await this.adapter.perform(action, this.session);
        const after = await this.adapter.observe();
        if (!step.complete(after)) throw new Error('Postcondition not met');
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
  }
}

module.exports = { Runner: Runner };
