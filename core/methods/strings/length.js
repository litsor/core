'use strict';

module.exports = {
  title: 'length',
  description: 'Get length of strings or arrays',

  inputSchema: {
    title: 'Input'
  },

  unary: input => {
    if (typeof input === 'string' || Array.isArray(input)) {
      return input.length;
    }
    if (input === null) {
      return 0;
    }
    return 1;
  }
};
