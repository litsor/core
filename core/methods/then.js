'use strict';

module.exports = {
  title: 'Then',
  description: 'Then',
  isBinary: true,
  cache: Infinity,
  lazy: true,

  inputSchema: {},

  outputSchema: () => {
    return {};
  },

  requires: [],

  tests: [],

  binary: async (left, right, dependencies, context) => {
    if (await left()) {
      return right();
    }
    return context.data;
  }
};
