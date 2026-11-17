'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { locate } = require('../src/tasks/manor/tab-geometry');
function fixture(scale) {
  return { verified: true, bounds: [100, 100, 900, 200].map(n => n * scale), children: [
    { clickable: true, bounds: [498, 100, 900, 200].map(n => n * scale) },
    { clickable: true, bounds: [100, 100, 502, 200].map(n => n * scale) }
  ] };
}
test('orders siblings by geometry independent of labels and scale', () => {
  for (const scale of [1, 2]) {
    const result = locate(fixture(scale));
    assert.equal(result.left[0], 100 * scale);
    assert.equal(result.right[0], 498 * scale);
    assert.equal(result.active, null);
  }
});
test('unverified or ambiguous containers are rejected', () => {
  assert.equal(locate({ ...fixture(1), verified: false }), null);
  const input = fixture(1);
  input.children.push(input.children[0]);
  assert.equal(locate(input), null);
  const overlap = fixture(1);
  overlap.children[0].bounds[0] = 200;
  assert.equal(locate(overlap), null);
});
