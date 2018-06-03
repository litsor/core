'use strict';

module.exports = {
  id: '/',
  title: '/',
  description: 'Divide',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {};
  },

  requires: [],

  tests: [],

  binary: (left, right) => left / right
};
