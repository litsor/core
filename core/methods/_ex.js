'use strict';

module.exports = {
  id: '!',
  title: '!',
  description: 'Negate',
  isUnary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {type: 'boolean'};
  },

  requires: [],

  tests: [],

  unary: operand => !operand
};
