'use strict';

// Run manually in the candidate Android script engine, not in Node.
var diagnostics = require('./src/platform/diagnostics.js');
var report = diagnostics.inspect({
  auto: typeof auto === 'undefined' ? null : auto,
  selector: typeof selector === 'undefined' ? null : selector,
  captureScreen: typeof captureScreen === 'undefined' ? null : captureScreen,
  requestScreenCapture: typeof requestScreenCapture === 'undefined' ? null : requestScreenCapture,
  ocr: typeof ocr === 'undefined' ? null : ocr,
  device: typeof device === 'undefined' ? null : device
});
console.log(JSON.stringify(report, null, 2));
