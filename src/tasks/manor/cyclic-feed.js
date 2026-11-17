'use strict';

// Pure policy. elapsedMs is measured from verified game entry, never per round.
function decide(state) {
  if (!state || state.pageVerified !== true) return { next: 'pause', reason: 'unknown-page' };
  if (state.phase === 'capacity-warning') {
    return { next: 'dismiss-warning-and-stop', reason: 'user-must-decide-capacity' };
  }
  if (state.obstructed !== false) return { next: 'pause', reason: 'obstructed-page' };
  if (!Number.isSafeInteger(state.elapsedMs) || state.elapsedMs < 0) {
    return { next: 'pause', reason: 'invalid-observation' };
  }
  if (state.phase === 'task-list') {
    if (state.rewardState === 'claimed') return { next: 'done' };
    if (state.rewardState === 'claimable' && state.rewardRowVerified === true && state.rewardVisible === true) {
      return { next: 'claim-once-and-verify' };
    }
    return { next: 'pause', reason: 'reward-not-confirmed' };
  }
  if (state.phase !== 'game') return { next: 'pause', reason: 'unknown-phase' };
  if (state.elapsedMs >= 50000) return { next: 'close-game-and-inspect-reward', reason: 'fifty-second-limit' };
  return { next: 'wait', remainingMs: 50000 - state.elapsedMs };
}

module.exports = { decide: decide };
