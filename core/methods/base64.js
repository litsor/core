'use strict';

module.exports = {
  title: 'Base64',
  description: 'Encode to base64',
  cache: Infinity,
  lazy: true,

  inputSchema: {
    title: 'Input string',
    type: 'string'
  },

  outputSchema: () => {
    return {type: 'boolean'};
  },

  requires: [],

  tests: [{
    input: 'test',
    output: 'dGVzdA=='
  }],

  unary: operand => Buffer.from(operand).toString('base64')
};
