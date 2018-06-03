'use strict';

module.exports = {
  title: 'And',
  description: 'Logical and',
  isBinary: true,
  cache: Infinity,
  lazy: true,

  inputSchema: {
    type: 'object'
  },

  outputSchema: () => {
    return {type: 'boolean'};
  },

  requires: [],

  tests: [],

  binary: async (left, right) => {
    const value = await left();
    if (value) {
      return right();
    }
    return false;
  }
};
