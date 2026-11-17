'use strict';

// Read-only: no gestures, screenshots, page text dumps, or file writes.
(function () {
  var report = { marker: 'ANTAUTODO_TABS', candidates: [], error: null };
  try {
    if (currentPackage() !== 'com.eg.android.AlipayGphone') throw new Error('Alipay not foreground');
    var nodes = selector().clickable(true).find();
    var seen = {};
    for (var i = 0; i < nodes.size(); i++) {
      var parent = nodes.get(i).parent();
      if (!parent || parent.childCount() !== 2) continue;
      var pb = parent.bounds();
      if (pb.top < 0 || pb.bottom > device.height * 0.3 || pb.width() < device.width * 0.5 || pb.height() <= 0) continue;
      var key = [pb.left, pb.top, pb.right, pb.bottom].join(',');
      if (seen[key]) continue;
      seen[key] = true;
      var children = [];
      for (var j = 0; j < 2; j++) {
        var child = parent.child(j);
        var b = child.bounds();
        if (!child.clickable() || b.width() < pb.width() * 0.4 || b.width() > pb.width() * 0.6) break;
        children.push({ bounds: [b.left, b.top, b.right, b.bottom], selected: child.selected() });
      }
      if (children.length === 2) report.candidates.push({ bounds: [pb.left, pb.top, pb.right, pb.bottom], children: children });
    }
    report.unique = report.candidates.length === 1;
    report.activeTabVerified = false;
  } catch (error) {
    report.error = String(error.message || error);
  }
  console.log('ANTAUTODO_TABS ' + JSON.stringify(report));
})();
