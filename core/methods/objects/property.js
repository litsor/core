'use strict';

module.exports = {
  title: 'Get',
  description: 'Get property from output in left operand',

  leftSchema: {type: 'object'},
  rightSchema: {type: 'string'},

  binary: async (left, right) => {
    return typeof left[right] === 'undefined' ? null : left[right];
  }
};
