'use strict';

module.exports = {
  title: 'length',
  description: 'Get length of strings or arrays',

  inputSchema: {
    title: 'Input'
  },

  requires: ['Immutable'],

  unary: (input, {Immutable}) => {
    if (Immutable.isImmutable(input)) {
      input = input.toJS();
    }
    if (typeof input === 'string' || Array.isArray(input)) {
      return input.length;
    }
    if (input === null) {
      return 0;
    }
    return 1;
  }
};
