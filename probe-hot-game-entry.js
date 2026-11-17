'use strict';

// One-shot diagnostic, run only after manual live-image confirmation of this task.
// No reward claim, coordinate gestures, retries, or additional game actions.
(function () {
  var report = { marker: 'ANTAUTODO_HOT_ENTRY', attempted: false };
  try {
    if (!auto.service || currentPackage() !== 'com.eg.android.AlipayGphone') throw new Error('Foreground/accessibility check failed');
    var matches = textMatches(/^试玩庄园火爆小游戏 打开即得30g饲料，玩一玩最多可得240g饲料\(0\/240\) 去完成$/).find();
    if (matches.size() !== 1) throw new Error('Task is not unique or progress changed');
    var parent = matches.get(0).parent();
    if (!parent || parent.childCount() !== 2) throw new Error('Unexpected task container');
    var button = null;
    for (var i = 0; i < parent.childCount(); i++) {
      var child = parent.child(i);
      if (String(child.text()) === '去完成' && child.clickable()) {
        if (button) throw new Error('Ambiguous button');
        button = child;
      }
    }
    if (!button || currentPackage() !== 'com.eg.android.AlipayGphone') throw new Error('Button or foreground changed');
    report.attempted = true;
    report.nodeClickAccepted = button.click();
    report.entryVerified = false;
  } catch (error) { report.error = String(error.message || error); }
  console.log('ANTAUTODO_HOT_ENTRY ' + JSON.stringify(report));
})();
