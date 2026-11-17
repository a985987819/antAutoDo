'use strict';
// UNVALIDATED prototype: see docs/forest-friend-energy.md. Local template required.
(function () {
  var template = null, count = 0, actions = 0, seen = {}, started = android.os.SystemClock.elapsedRealtime();
  var keyguard = context.getSystemService(context.KEYGUARD_SERVICE);
  function safe() {
    return device.isScreenOn() && !keyguard.isKeyguardLocked() && currentPackage() === 'com.eg.android.AlipayGphone' &&
      android.os.SystemClock.elapsedRealtime() - started < 600000 && actions < 100;
  }
  function wait(ms) {
    for (var elapsed = 0; elapsed < ms; elapsed += 100) {
      if (!safe()) throw new Error('Foreground, lock or budget guard');
      sleep(100);
    }
  }
  function identity() {
    if (!safe() || !text('TA待收的能量').exists()) return null;
    var nodes = textMatches(/^.+的蚂蚁森林$/).find(), found = [];
    for (var i = 0; i < nodes.size(); i++) {
      var n = nodes.get(i), b = n.bounds();
      if (b.width() > 0 && b.top > 0 && b.bottom < 330) found.push(String(n.text()));
    }
    return found.length === 1 ? found[0] : null;
  }
  function match() {
    if (!identity()) return null;
    var screen = captureScreen();
    if (!screen || screen.getWidth() !== 1220 || screen.getHeight() !== 2656) throw new Error('Display changed');
    var point = images.findImage(screen, template, { region: [1010, 1370, 210, 180], threshold: 0.95 });
    return point;
  }
  try {
    if (device.width !== 1220 || device.height !== 2656 || !identity()) throw new Error('Verified friend page required');
    if (!requestScreenCapture(false)) throw new Error('Capture denied');
    sleep(1800);
    if (!identity()) throw new Error('Friend page not restored after capture permission');
    template = images.read('/sdcard/antAutoDo-diagnostics/onekey-label-v2.png');
    if (!template) throw new Error('Missing local template');
    while (count < 50 && safe()) {
      var before = identity();
      if (!before || seen[before]) throw new Error('Unknown or repeated friend');
      seen[before] = true;
      var point = match();
      if (!point) throw new Error('One-key button not confirmed; no blind click');
      if (!safe() || identity() !== before) throw new Error('Page changed before action');
      actions++;
      press(point.x + template.getWidth() / 2, point.y + template.getHeight() / 2, 100);
      var finished = false;
      for (var poll = 0; poll < 20; poll++) {
        wait(200);
        if (identity() !== before) throw new Error('Unexpected page after collect');
        if (!match()) { finished = true; break; }
      }
      if (!finished) throw new Error('Collect result not confirmed');
      count++;
      console.log('ANTAUTODO_PHONE_LOOP ' + JSON.stringify({ collectedPages: count, actions: actions }));
      if (count >= 50 || !safe()) break;
      actions++;
      swipe(620, 2350, 620, 1350, 600);
      var changed = false;
      for (var p = 0; p < 25; p++) {
        wait(200);
        var after = identity();
        if (after && after !== before) { changed = true; break; }
      }
      if (!changed) throw new Error('No verified next friend; stopping');
      wait(500);
    }
  } catch (error) {
    console.log('ANTAUTODO_PHONE_LOOP_STOP ' + JSON.stringify({ collectedPages: count, actions: actions, reason: String(error.message || error) }));
  } finally {
    if (template) template.recycle();
  }
})();
