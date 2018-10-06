'use strict';

module.exports = {
  title: 'Get',
  description: 'Get property from output in left operand',

  requires: [],

  tests: [],

  binary: async (left, right) => {
    if (typeof left !== 'object' || left === null) {
      return null;
    }
    return typeof left[right] === 'undefined' ? null : left[right];
  }
};
