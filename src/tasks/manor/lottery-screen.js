'use strict';

function normalize(text) {
  return String(text || '').replace(/\s+/g, '');
}

// Rows must be grouped by their actual shared container, never by nearest screen Y.
// visible means the adapter verified non-empty bounds within the screen viewport.
function recognize(input) {
  if (!input || input.packageName !== 'com.eg.android.AlipayGphone' || !Array.isArray(input.rows)) {
    return { status: 'unknown' };
  }
  var sign = input.rows.filter(function (r) { return /^每日签到(?:\(1\/1\)|\(0\/1\))?$/.test(normalize(r.title)); });
  var browse = input.rows.filter(function (r) { return /^去杂货铺逛一逛\([0-3]\/3\)$/.test(normalize(r.title)); });
  var exchange = input.rows.filter(function (r) { return normalize(r.title) === '消耗饲料换机会'; });
  if (sign.length !== 1 || browse.length !== 1 || exchange.length !== 1) return { status: 'unknown' };
  var description = normalize(sign[0].description);
  var tab = description === '每日访问IP抽抽乐，可得1次机会' ? 'event' :
    description === '每日访问抽抽乐，可得1次机会' ? 'daily' : null;
  if (!tab) return { status: 'unknown' };
  var rows = [sign[0], browse[0], exchange[0]];
  if (rows.some(function (r) { return r.visible !== true; })) return { status: 'needs-visible-tasks', tab: tab };
  var progress = Number(normalize(browse[0].title).match(/\(([0-3])\/3\)/)[1]);
  var complete = rows.every(function (r) { return normalize(r.button) === '已完成'; }) && progress === 3;
  var chance = input.chances;
  var match = chance && chance.visible === true && normalize(chance.text).match(/^还剩(\d+)次机会$/);
  var chances = match ? Number(match[1]) : null;
  if (!Number.isSafeInteger(chances)) chances = null;
  return {
    status: complete ? 'tasks-complete' : 'needs-tasks',
    tab: tab,
    browseProgress: progress,
    tasksComplete: complete,
    chances: chances,
    next: !complete ? 'inspect-unfinished-tasks' : chances === null ? 'inspect-visible-chances' : chances === 0 ? 'skip-draw' : 'inspect-auto-draw',
    nativeAutoDrawVerified: false
  };
}

module.exports = { recognize: recognize };
