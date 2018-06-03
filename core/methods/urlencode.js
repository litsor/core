'use strict';

module.exports = {
  id: 'urlencode',
  title: 'Url encode',
  description: 'Url encode',
  isUnary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {type: 'string'};
  },

  requires: [],

  tests: [],

  unary: operand => encodeURIComponent(operand)
};
