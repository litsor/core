'use strict';

module.exports = {
  title: 'Round',
  description: 'Round number',
  isUnary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {};
  },

  requires: [],

  tests: [],

  unary: operand => Math.round(operand)
};
