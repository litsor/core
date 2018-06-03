'use strict';

module.exports = {
  id: 'parseInt',
  title: 'Parse int',
  description: 'Convert string to integer',
  isUnary: true,
  cache: Infinity,

  inputSchema: {
    type: 'string'
  },

  outputSchema: () => {
    return {type: 'integer'};
  },

  requires: [],

  tests: [],

  unary: input => parseInt(input, 10)
};
