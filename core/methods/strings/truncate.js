'use strict';

module.exports = {
  title: 'Truncate',
  description: 'Truncate string to length',
  isBinary: true,
  cache: Infinity,

  inputSchema: {},

  outputSchema: () => {
    return {type: 'string'};
  },

  requires: [],

  tests: [],

  binary: (string, length) => string.substring(0, length)
};
