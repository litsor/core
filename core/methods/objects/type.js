'use strict';

module.exports = {
  name: 'Type',
  description: 'Get type of input',

  inputSchema: {},

  requires: ['Immutable'],

  unary: (input, {Immutable}) => {
    input = Immutable.isImmutable(input) ? input.toJS() : input;
    if (input === null || typeof input === 'undefined') {
      return 'null';
    }
    if (Array.isArray(input)) {
      return 'array';
    }
    return typeof input;
  }
};
