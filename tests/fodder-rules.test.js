'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { plan } = require('../src/tasks/manor/fodder-rules');
const openTitles = ['免费领大额外卖红包', '去淘金币小镇逛一逛', '去蚂蚁新村逛一逛', '去芝麻攒粒攻略逛一逛', '去蚂蚁森林逛一逛', '家庭新活动上线', '看一看休闲小游戏'];
const crossAppTitles = ['去美团逛一逛领金币', '去大众点评赢免单', '去闲鱼逛一逛'];
const timedTitles = ['去杂货铺逛一逛', '看庄园小视频', '搜“意外险”选百万保障'];
function row(title, state) { return { title, state: state || 'pending', visible: true, rowVerified: true }; }
test('seven open tasks have a two-second minimum', () => {
  for (const title of openTitles) {
    const result = plan(row(title));
    assert.equal(result.minDwellMs, 2000);
    assert.equal(result.completionVerified, false);
  }
});
test('timed tasks have a fifteen-second minimum, not assumed completion', () => {
  for (const title of timedTitles) {
    const result = plan(row(title));
    assert.equal(result.minDwellMs, 15000);
    assert.equal(result.next, 'open-wait-return-verify');
    assert.equal(result.completionVerified, false);
  }
});
test('cross-app tasks require target inspection and five seconds after arrival', () => {
  for (const title of crossAppTitles) {
    const result = plan(row(title));
    assert.equal(result.next, 'inspect-cross-app-target');
    assert.equal(result.type, 'cross-app');
    assert.equal(result.minDwellMs, 5000);
    assert.equal(result.dwellStartsAt, 'verified-target-page');
    assert.equal(result.returnMode, 'switch-to-alipay');
    assert.equal(result.completionVerified, false);
    assert.equal(plan(row(title, 'claimable')).next, 'claim-and-verify');
    assert.equal(plan({ ...row(title), visible: false }).next, 'locate-visible-row');
  }
});
test('all fourteen claimed tasks are skipped, even off screen', () => {
  for (const title of openTitles.concat(timedTitles, crossAppTitles, ['送你90g饲料奖励！'])) {
    assert.equal(plan({ ...row(title, 'claimed'), visible: false }).reason, 'already-claimed');
  }
});
test('claimable never reopens and off-screen rows cannot be clicked', () => {
  assert.equal(plan(row(openTitles[0], 'claimable')).next, 'claim-and-verify');
  assert.equal(plan({ ...row(openTitles[0], 'claimable'), visible: false }).next, 'locate-visible-row');
});
test('90g followup requires prerequisite verification, not a new timed visit', () => {
  assert.equal(plan(row('送你90g饲料奖励！')).next, 'needs-human');
  assert.equal(plan(row('送你90g饲料奖励！', 'claimable')).next, 'claim-and-verify');
  assert.equal(plan(row('送你90s饲料奖励')).reason, 'not-allowlisted');
});
test('unknown titles, states and unverified pairing fail closed', () => {
  assert.equal(plan(row('线上支付')).reason, 'not-allowlisted');
  assert.equal(plan(row(openTitles[0], 'unknown')).reason, 'unknown-state');
  assert.equal(plan({ ...row(openTitles[0]), rowVerified: false }).next, 'needs-human');
});
