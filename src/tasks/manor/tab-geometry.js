'use strict';

// The adapter supplies sibling nodes from one verified tab container.
// Geometry locates targets only; it does not establish the active tab.
function locate(container) {
  if (!container || container.verified !== true || !Array.isArray(container.children) || container.children.length !== 2) return null;
  var bounds = container.bounds;
  function valid(b) {
    return Array.isArray(b) && b.length === 4 && b.every(Number.isFinite) && b[2] > b[0] && b[3] > b[1];
  }
  if (!valid(bounds)) return null;
  var nodes = container.children.slice().sort(function (a, b) { return a.bounds && b.bounds ? a.bounds[0] - b.bounds[0] : 0; });
  if (nodes.some(function (n) {
    return n.clickable !== true || !valid(n.bounds) || n.bounds[0] < bounds[0] || n.bounds[1] < bounds[1] || n.bounds[2] > bounds[2] || n.bounds[3] > bounds[3];
  })) return null;
  var width = bounds[2] - bounds[0];
  if (Math.abs(nodes[0].bounds[1] - nodes[1].bounds[1]) > (bounds[3] - bounds[1]) * 0.1 ||
      nodes[0].bounds[2] - nodes[1].bounds[0] > width * 0.05 ||
      nodes.some(function (n) { var ratio = (n.bounds[2] - n.bounds[0]) / width; return ratio < 0.4 || ratio > 0.6; })) return null;
  return { left: nodes[0].bounds.slice(), right: nodes[1].bounds.slice(), active: null };
}

module.exports = { locate: locate };
