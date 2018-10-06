'use strict';

module.exports = {
  title: 'From',
  description: 'Get substring from right operand to end of string',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {type: 'string'};
  },

  requires: [],

  tests: [],

  binary: (string, from) => string.substring(from)
};
