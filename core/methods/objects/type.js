'use strict';

module.exports = {
  name: 'Type',
  description: 'Get type of input',

  inputSchema: {},

  unary: input => {
    if (input === null || typeof input === 'undefined') {
      return 'null';
    }
    if (Array.isArray(input)) {
      return 'array';
    }
    return typeof input;
  }
};
