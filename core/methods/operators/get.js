'use strict';

module.exports = {
  title: 'Get',
  description: 'Get dynamic property in left operand',

  leftSchema: {},
  rightSchema: {},

  binary: async (left, right, {Immutable}) => {
    if (!Immutable.isImmutable(left)) {
      return null;
    }
    const output = left.getIn([right]);
    if (typeof output === 'undefined') {
      return null;
    }
    return output;
  }
};
