'use strict';

module.exports = {
  title: 'Or',
  description: 'Logical or',
  isBinary: true,
  cache: Infinity,
  lazy: true,

  inputSchema: {
    type: 'object'
  },

  binary: async (left, right) => {
    const value = await left();
    return value ? value : right();
  }
};
