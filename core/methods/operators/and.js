'use strict';

module.exports = {
  title: 'And',
  description: 'Logical and',
  isBinary: true,
  cache: Infinity,
  lazy: true,

  leftSchema: {},
  rightSchema: {},

  binary: async (left, right, {}, context) => {
    if (context.methodState === null) {
      context.methodState = Boolean(await left());
    }
    if (context.methodState) {
      return right();
    }
    return false;
  }
};
