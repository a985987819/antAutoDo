'use strict';

// Pure policy: image perception and device actions are not implemented here.
function decide(state) {
  if (!state || state.pageVerified !== true || state.obstructed !== false) {
    return { next: 'pause', reason: 'unknown-or-obstructed-page' };
  }
  if (!Number.isSafeInteger(state.elapsedMs) || state.elapsedMs < 0 ||
      !Number.isSafeInteger(state.earnedGrams) || state.earnedGrams < 0 || state.earnedGrams > 240) {
    return { next: 'pause', reason: 'invalid-observation' };
  }
  if (state.elapsedMs >= 600000) return { next: 'pause', reason: 'session-timeout' };
  if (state.phase === 'task-list') {
    if (state.rewardState === 'claimed') return { next: 'done' };
    if (state.rewardState === 'claimable' && state.rewardRowVerified === true && state.rewardVisible === true) {
      return { next: 'claim-once-and-verify' };
    }
    return { next: 'pause', reason: 'reward-not-confirmed' };
  }
  if (state.phase !== 'game') return { next: 'pause', reason: 'unknown-phase' };
  if (state.earnedGrams === 240) return { next: 'return-once-and-inspect-reward', reason: 'verified-reward-cap' };
  if (!Number.isSafeInteger(state.sinceLastPollMs) || state.sinceLastPollMs < 0) {
    return { next: 'pause', reason: 'invalid-poll-time' };
  }
  if (state.sinceLastPollMs < 30000) return { next: 'wait', remainingMs: 30000 - state.sinceLastPollMs };
  if (state.timerState === 'running' || state.timerState === 'new-round') {
    return { next: 'observe-next-window', intervalMs: 30000 };
  }
  if (state.timerState === 'stopped' && state.stopVerified === true) {
    return { next: 'return-once-and-inspect-reward', reason: 'timer-ended' };
  }
  return { next: 'pause', reason: 'timer-state-uncertain' };
}

module.exports = { decide: decide };
