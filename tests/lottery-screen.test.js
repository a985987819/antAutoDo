'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { recognize } = require('../src/tasks/manor/lottery-screen');

// Artificial fixtures contain public task wording only, not a device dump.
function fixture(event) {
  return {
    packageName: 'com.eg.android.AlipayGphone',
    tab: event ? 'right' : 'left',
    tabVerified: true,
    rows: [
      { title: event ? '每日签到(1/1)' : '每日签到 ', description: event ? '每日访问IP抽抽乐，可得1次机会' : '每日访问抽抽乐，可得1次机会', button: '已完成', visible: true },
      { title: '去杂货铺逛一逛 (3/3)', button: '已完成', visible: true },
      { title: '消耗饲料换机会', button: '已完成', visible: true },
      { title: '其他任务', button: '去完成', visible: true }
    ],
    chances: { text: '还剩0次机会', visible: true }
  };
}

test('recognizes each tab and skips completed zero-chance page', () => {
  for (const event of [false, true]) {
    const result = recognize(fixture(event));
    assert.equal(result.tab, event ? 'right' : 'left');
    assert.equal(result.next, 'skip-draw');
    assert.equal(result.tasksComplete, true);
    assert.equal(result.nativeAutoDrawVerified, false);
  }
});

test('off-screen chance count is not trusted', () => {
  const input = fixture(true);
  input.chances.visible = false;
  assert.equal(recognize(input).chances, null);
  assert.equal(recognize(input).next, 'inspect-visible-chances');
});

test('duplicate task rows, unknown tab and other app fail closed', () => {
  const duplicate = fixture(false);
  duplicate.rows.push(duplicate.rows[0]);
  assert.equal(recognize(duplicate).status, 'unknown');
  const unknown = fixture(false);
  unknown.rows[0].description = 'unknown';
  assert.equal(recognize(unknown).tab, 'left');
  unknown.tabVerified = false;
  assert.equal(recognize(unknown).tab, null);
  assert.equal(recognize({ ...fixture(false), packageName: 'other' }).status, 'unknown');
});

test('incomplete progress cannot be treated as completed', () => {
  const input = fixture(false);
  input.rows[1].title = '去杂货铺逛一逛(2/3)';
  assert.equal(recognize(input).tasksComplete, false);
  input.rows[1].visible = false;
  assert.equal(recognize(input).status, 'needs-visible-tasks');
});
