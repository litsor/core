'use strict';

module.exports = {
  title: 'Starts with',
  description: 'Check if string from left operand starts with right operand',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {};
  },

  requires: [],

  tests: [],

  binary: (left, right) => left.startsWith(right)
};
