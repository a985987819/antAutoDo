'use strict';

// Feature presence is not a compatibility claim. No screenshots, clicks, or text dumps.
function inspect(runtime) {
  return {
    accessibilityAvailable: Boolean(runtime.auto && runtime.auto.service),
    selectorAvailable: typeof runtime.selector === 'function',
    captureApiPresent: typeof runtime.captureScreen === 'function',
    capturePermissionApiPresent: typeof runtime.requestScreenCapture === 'function',
    ocrApiPresent: Boolean(runtime.ocr),
    androidRelease: runtime.device ? String(runtime.device.release) : 'unknown',
    deviceValidated: false
  };
}

module.exports = { inspect: inspect };
