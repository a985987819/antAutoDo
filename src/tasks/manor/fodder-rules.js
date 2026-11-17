'use strict';

var rules = [
  ['免费领大额外卖红包', 'open', 2000],
  ['去淘金币小镇逛一逛', 'open', 2000],
  ['去蚂蚁新村逛一逛', 'open', 2000],
  ['去芝麻攒粒攻略逛一逛', 'open', 2000],
  ['去蚂蚁森林逛一逛', 'open', 2000],
  ['家庭新活动上线', 'open', 2000],
  ['看一看休闲小游戏', 'open', 2000],
  ['去杂货铺逛一逛', 'timed', 15000],
  ['看庄园小视频', 'timed', 15000],
  ['搜“意外险”选百万保障', 'timed', 15000],
  ['送你90g饲料奖励！', 'reward-followup', 15000]
];

// The adapter must extract the exact title and state from one verified task row.
// Minimum dwell is not evidence of completion. This module performs no actions.
function plan(row) {
  if (!row || row.rowVerified !== true) return { next: 'needs-human', reason: 'unverified-row' };
  var matches = rules.filter(function (rule) { return rule[0] === row.title; });
  if (matches.length !== 1) return { next: 'skip', reason: 'not-allowlisted' };
  var rule = matches[0];
  if (row.state === 'claimed') return { next: 'skip', reason: 'already-claimed' };
  if (row.visible !== true) return { next: 'locate-visible-row', title: row.title };
  if (row.state === 'claimable') return { next: 'claim-and-verify', title: row.title };
  if (row.state !== 'pending') return { next: 'needs-human', reason: 'unknown-state' };
  if (rule[1] === 'reward-followup') return { next: 'needs-human', reason: 'verify-prerequisite-and-claim-state' };
  return {
    next: 'open-wait-return-verify',
    title: row.title,
    type: rule[1],
    minDwellMs: rule[2],
    completionVerified: false
  };
}

module.exports = { plan: plan };
