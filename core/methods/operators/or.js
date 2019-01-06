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

  binary: async (left, right, {}, context) => {
    if (context.methodState === null) {
      const value = await left();
      if (value) {
        return value;
      }
      context.methodState = false;
    }
    return right();
  }
};
