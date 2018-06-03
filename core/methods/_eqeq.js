'use strict';

module.exports = {
  id: '==',
  title: '==',
  description: 'Equals',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {type: 'boolean'};
  },

  requires: [],

  tests: [],

  binary: (left, right) => left == right
};
