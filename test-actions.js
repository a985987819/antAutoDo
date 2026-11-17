'use strict';

// All gestures are restricted to our own foreground diagnostic dialog.
(function () {
  var AtomicBoolean = java.util.concurrent.atomic.AtomicBoolean;
  var clicked = new AtomicBoolean(false);
  var dismissed = new AtomicBoolean(false);
  var report = { marker: 'ANTAUTODO_ACTIONS', clickVerified: false, swipeVerified: false, backVerified: false };
  var dialog;
  var scroll;
  try {
    if (!auto.service) throw new Error('Accessibility not enabled');
    app.launchPackage(String(context.getPackageName()));
    sleep(1200);
    ui.run(function () {
      scroll = new android.widget.ScrollView(context);
      var layout = new android.widget.LinearLayout(context);
      layout.setOrientation(1);
      var button = new android.widget.Button(context);
      button.setText('ANTAUTODO TEST CLICK');
      button.setOnClickListener(new android.view.View.OnClickListener({
        onClick: function () { clicked.set(true); button.setText('ANTAUTODO CLICK OK'); }
      }));
      layout.addView(button);
      for (var i = 0; i < 60; i++) {
        var label = new android.widget.TextView(context);
        label.setText('ANTAUTODO TEST ROW ' + i);
        label.setTextSize(22);
        label.setPadding(20, 24, 20, 24);
        layout.addView(label);
      }
      scroll.addView(layout);
      dialog = dialogs.build({ title: 'antAutoDo action test', customView: scroll, wrapInScrollView: false, autoDismiss: false });
      dialog.on('dismiss', function () { dismissed.set(true); });
      dialog.show();
    });
    var target = text('ANTAUTODO TEST CLICK').findOne(5000);
    if (!target || currentPackage() !== context.getPackageName()) throw new Error('Test dialog not foreground');
    var b = target.bounds();
    report.clickAccepted = click(b.centerX(), b.centerY());
    sleep(1500);
    report.gestureClickVerified = clicked.get();
    if (!clicked.get()) {
      var fresh = text('ANTAUTODO TEST CLICK').findOne(1000);
      if (fresh) report.nodeClickAccepted = fresh.click();
      sleep(700);
    }
    report.clickVerified = clicked.get();
    var rect = new android.graphics.Rect();
    var before = 0;
    ui.run(function () { scroll.getGlobalVisibleRect(rect); before = scroll.getScrollY(); });
    if (currentPackage() !== context.getPackageName() || dismissed.get()) throw new Error('Test dialog lost focus');
    report.swipeAccepted = swipe(rect.centerX(), rect.top + Math.floor(rect.height() * 0.75), rect.centerX(), rect.top + Math.floor(rect.height() * 0.25), 500);
    sleep(900);
    ui.run(function () { report.swipeVerified = scroll.getScrollY() > before; });
    if (!report.swipeVerified) throw new Error('Swipe did not scroll test content');
    if (currentPackage() !== context.getPackageName() || dismissed.get()) throw new Error('Test dialog lost focus');
    report.backAccepted = back();
    sleep(700);
    report.backVerified = dismissed.get();
  } catch (error) {
    report.error = String(error.message || error);
  } finally {
    ui.run(function () { if (dialog && !dismissed.get()) dialog.dismiss(); });
    console.log('ANTAUTODO_ACTIONS ' + JSON.stringify(report));
  }
})();
