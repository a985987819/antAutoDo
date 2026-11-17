'use strict';

// Input is a normalized observation, not raw OCR output. Unknown values fail closed.
function planTab(tab) {
  if (!tab || ['daily', 'event'].indexOf(tab.id) < 0 || tab.verified !== true) {
    return { status: 'needs-human', reason: 'unknown-tab' };
  }
  if (tab.tasksComplete !== true) return { status: 'needs-tasks' };
  if (!Number.isSafeInteger(tab.chances) || tab.chances < 0) {
    return { status: 'needs-human', reason: 'unknown-chances' };
  }
  if (tab.chances < 6) return { status: 'shortfall', missing: 6 - tab.chances };
  if (tab.nativeAutoDraw !== true) return { status: 'needs-human', reason: 'unknown-auto-draw' };
  if (tab.autoDrawMode !== 'all' && tab.autoDrawMode !== 'exact-six') {
    return { status: 'needs-human', reason: 'unknown-draw-mode' };
  }
  if (tab.chances > 6 && tab.autoDrawMode === 'all') {
    return { status: 'needs-human', reason: 'would-overdraw' };
  }
  return { status: 'ready', tab: tab.id, count: 6, expectedRemaining: tab.chances - 6 };
}

module.exports = { planTab: planTab };
