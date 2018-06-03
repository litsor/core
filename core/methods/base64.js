'use strict';

module.exports = {
  title: 'Base64',
  description: 'Encode to base64',
  isUnary: true,
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

  unary: operand => Buffer.from(operand).toString('base64')
};
