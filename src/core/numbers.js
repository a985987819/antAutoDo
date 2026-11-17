'use strict';

function isFiniteNumber(value) {
  return typeof value === 'number' && isFinite(value);
}

function isSafeInteger(value) {
  return isFiniteNumber(value) && Math.floor(value) === value && Math.abs(value) <= 9007199254740991;
}

module.exports = { isFiniteNumber: isFiniteNumber, isSafeInteger: isSafeInteger };
