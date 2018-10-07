'use strict';

module.exports = {
  name: 'Keys',
  description: 'Get property keys of an object',

  inputSchema: {type: 'object'},

  unary: input => {
    if (typeof input !== 'object' || input === null) {
      return [];
    }
    return Object.keys(input);
  }
};
