'use strict';

module.exports = {
  title: 'Map',
  description: 'Process each item in an array',
  isBinary: true,
  cache: 0,
  lazy: true,

  inputSchema: {},

  outputSchema: () => {
    return {};
  },

  requires: [],

  tests: [],

  binary: async (left, right) => {
    const value = await left();
    if (!Array.isArray(value)) {
      throw new TypeError('Left operand for map must be an array');
    }
    return Promise.all(value.map(item => right(item)));
  }
};
