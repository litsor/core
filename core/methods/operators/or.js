'use strict';

module.exports = {
  title: 'Or',
  description: 'Logical or',
  lazy: true,

  inputSchema: {
    type: 'object'
  },

  binary: async (left, right) => {
    const value = await left();
    return value ? value : right();
  }
};
